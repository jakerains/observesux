import Foundation

// MARK: - SSE Client for Chat Streaming
// Parses the Vercel AI SDK SSE format:
//   "0:" → text delta
//   "9:" → tool call start
//   "a:" → tool result
//   "e:" → error
//   "d:" → finish

actor SSEClient {
    private let session: URLSession

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 120
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }

    func stream(
        url: URL,
        body: ChatRequest
    ) -> AsyncStream<ChatSSEEvent> {
        AsyncStream { continuation in
            let task = Task {
                do {
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("text/event-stream", forHTTPHeaderField: "Accept")

                    if let token = KeychainManager.read(.authToken) {
                        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                    }

                    let encoder = JSONEncoder()
                    request.httpBody = try encoder.encode(body)

                    let (bytes, response) = try await session.bytes(for: request)

                    guard let httpResponse = response as? HTTPURLResponse,
                          (200...299).contains(httpResponse.statusCode) else {
                        continuation.yield(.error("HTTP error"))
                        continuation.finish()
                        return
                    }

                    for try await line in bytes.lines {
                        guard !Task.isCancelled else { break }

                        if let event = parseLine(line) {
                            continuation.yield(event)

                            if case .finish = event {
                                break
                            }
                        }
                    }

                    continuation.finish()
                } catch {
                    if !Task.isCancelled {
                        continuation.yield(.error(error.localizedDescription))
                    }
                    continuation.finish()
                }
            }

            continuation.onTermination = { _ in
                task.cancel()
            }
        }
    }

    private func parseLine(_ line: String) -> ChatSSEEvent? {
        // Vercel AI SDK format: "prefix:JSON"
        guard line.count >= 2 else { return nil }

        let prefix = String(line.prefix(2))
        let payload = String(line.dropFirst(2))

        switch prefix {
        case "0:":
            // Text delta — payload is a JSON string
            if let text = parseJSONString(payload) {
                return .textDelta(text)
            }

        case "9:":
            // Tool call start — payload is JSON object with toolCallId, toolName
            if let data = payload.data(using: .utf8),
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let id = json["toolCallId"] as? String,
               let name = json["toolName"] as? String {
                return .toolCallStart(id: id, name: name)
            }

        case "a:":
            // Tool result — payload is JSON object
            if let data = payload.data(using: .utf8),
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let id = json["toolCallId"] as? String {
                let content = (json["result"] as? String) ?? payload
                return .toolResult(id: id, content: content)
            }

        case "e:":
            // Error
            if let text = parseJSONString(payload) {
                return .error(text)
            }
            return .error(payload)

        case "d:":
            // Finish
            if let text = parseJSONString(payload) {
                return .finish(text)
            }
            return .finish(payload)

        default:
            break
        }

        return nil
    }

    private func parseJSONString(_ json: String) -> String? {
        guard let data = json.data(using: .utf8),
              let value = try? JSONSerialization.jsonObject(with: data) as? String else {
            return nil
        }
        return value
    }
}
