import Foundation

@Observable
@MainActor
final class ChatViewModel {
    var messages: [ChatMessage] = []
    var inputText = ""
    var isStreaming = false
    var sessionId: String?

    private let sseClient = SSEClient()
    private var streamTask: Task<Void, Never>?

    var suggestedQuestions: [String] {
        guard messages.isEmpty else { return [] }
        return [
            "What's the weather like right now?",
            "Any traffic issues on I-29?",
            "What's the cheapest gas in Sioux City?",
            "Are there any weather alerts?",
            "What's the river level?",
        ]
    }

    func send(_ text: String? = nil) {
        let messageText = text ?? inputText
        guard !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        // Add user message
        let userMessage = ChatMessage(role: .user, content: messageText)
        messages.append(userMessage)
        inputText = ""

        // Create placeholder assistant message
        let assistantMessage = ChatMessage(role: .assistant, content: "", isStreaming: true)
        messages.append(assistantMessage)
        let assistantIndex = messages.count - 1

        isStreaming = true

        // Build request
        let requestMessages = messages
            .filter { $0.role == .user || ($0.role == .assistant && !$0.content.isEmpty && !$0.isStreaming) }
            .map { ChatRequestMessage(role: $0.role.rawValue, content: $0.content) }

        let request = ChatRequest(
            messages: requestMessages,
            sessionId: sessionId
        )

        streamTask = Task {
            let stream = await sseClient.stream(url: Endpoints.chat, body: request)

            for await event in stream {
                guard !Task.isCancelled else { break }

                switch event {
                case .textDelta(let text):
                    messages[assistantIndex].content += text

                case .toolCallStart(let id, let name):
                    let toolCall = ToolCall(id: id, name: name, arguments: [:])
                    messages[assistantIndex].toolCalls.append(toolCall)

                case .toolResult(let id, let content):
                    if let idx = messages[assistantIndex].toolCalls.firstIndex(where: { $0.id == id }) {
                        messages[assistantIndex].toolCalls[idx].result = ToolResult(
                            content: content,
                            isError: false
                        )
                    }

                case .error(let message):
                    messages[assistantIndex].content += "\n[Error: \(message)]"

                case .finish:
                    break
                }
            }

            messages[assistantIndex].isStreaming = false
            isStreaming = false
        }
    }

    func cancel() {
        streamTask?.cancel()
        isStreaming = false
        if let last = messages.last, last.isStreaming {
            messages[messages.count - 1].isStreaming = false
        }
    }

    func clearChat() {
        messages.removeAll()
        sessionId = nil
    }
}
