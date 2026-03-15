import Foundation

enum WidgetAPIClient {
  private static let baseURL = URL(string: "https://siouxland.online")!
  private static let decoder: JSONDecoder = {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return decoder
  }()

  static func fetchSunPayload() async throws -> SunWidgetPayload? {
    let envelope: SunAPIEnvelope = try await fetchJSON(path: "/api/sun")
    return envelope.data
  }

  static func fetchDigestPayload() async throws -> DigestWidgetPayload? {
    let envelope: DigestResponseEnvelope = try await fetchJSON(path: "/api/user/digest")
    return envelope.digest
  }

  private static func fetchJSON<T: Decodable>(path: String) async throws -> T {
    var request = URLRequest(url: baseURL.appending(path: path))
    request.timeoutInterval = 15
    request.cachePolicy = .reloadIgnoringLocalCacheData
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.setValue("SiouxlandWidgets/1.0", forHTTPHeaderField: "User-Agent")

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
      throw URLError(.badServerResponse)
    }

    return try decoder.decode(T.self, from: data)
  }
}
