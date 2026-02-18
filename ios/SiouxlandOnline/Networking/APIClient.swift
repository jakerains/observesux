import Foundation
import os

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case httpError(statusCode: Int, body: String?)
    case decodingError(Error)
    case networkError(Error)
    case noData

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            "Invalid URL"
        case .httpError(let code, let body):
            "HTTP \(code): \(body ?? "Unknown error")"
        case .decodingError(let error):
            "Decoding error: \(error.localizedDescription)"
        case .networkError(let error):
            "Network error: \(error.localizedDescription)"
        case .noData:
            "No data received"
        }
    }
}

// MARK: - API Client

actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "APIClient")

    private init() {
        let config = URLSessionConfiguration.default
        config.urlCache = URLCache(
            memoryCapacity: 20 * 1024 * 1024,  // 20 MB memory
            diskCapacity: 100 * 1024 * 1024     // 100 MB disk
        )
        config.requestCachePolicy = .useProtocolCachePolicy
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        self.session = URLSession(configuration: config)

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            // Try ISO 8601 with fractional seconds first (Next.js default)
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }

            // Fallback to ISO 8601 without fractional seconds
            isoFormatter.formatOptions = [.withInternetDateTime]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }

            // Fallback to epoch milliseconds (some APIs use this)
            if let ms = Double(dateString) {
                return Date(timeIntervalSince1970: ms / 1000)
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date from: \(dateString)"
            )
        }
        self.decoder = decoder
    }

    // MARK: - Generic Fetch

    func fetch<T: Decodable>(_ url: URL) async throws -> T {
        var request = URLRequest(url: url)
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Inject auth token if available
        if let token = KeychainManager.read(.authToken) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        logger.debug("Fetching: \(url.absoluteString)")

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            logger.error("Network error for \(url.absoluteString): \(error.localizedDescription)")
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            logger.error("No HTTP response for \(url.absoluteString)")
            throw APIError.noData
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            logger.error("HTTP \(httpResponse.statusCode) for \(url.absoluteString): \(body ?? "nil")")
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: body)
        }

        do {
            let result = try decoder.decode(T.self, from: data)
            logger.debug("Success: \(url.absoluteString)")
            return result
        } catch {
            logger.error("Decoding error for \(url.absoluteString): \(error.localizedDescription)")
            throw APIError.decodingError(error)
        }
    }

    /// Fetch an ApiResponse<T> wrapper and return the data payload
    func fetchData<T: Decodable & Sendable>(_ url: URL) async throws -> T {
        let response: ApiResponse<T> = try await fetch(url)
        guard let data = response.data else {
            if let error = response.error {
                throw APIError.httpError(statusCode: 500, body: error)
            }
            throw APIError.noData
        }
        return data
    }

    /// Fetch an ApiResponse<T> wrapper and return the full response (with timestamp, source)
    func fetchResponse<T: Decodable & Sendable>(_ url: URL) async throws -> ApiResponse<T> {
        try await fetch(url)
    }

    // MARK: - POST

    func post<Body: Encodable, Response: Decodable>(
        _ url: URL,
        body: Body
    ) async throws -> Response {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token = KeychainManager.read(.authToken) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        logger.debug("POST: \(url.absoluteString)")

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.noData
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            logger.error("POST HTTP \(httpResponse.statusCode) for \(url.absoluteString): \(body ?? "nil")")
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: body)
        }

        return try decoder.decode(Response.self, from: data)
    }
}
