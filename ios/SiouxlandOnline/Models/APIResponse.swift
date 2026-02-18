import Foundation

// MARK: - Generic API Response Wrapper
// Matches the web app's ApiResponse<T> pattern

struct ApiResponse<T: Decodable & Sendable>: Decodable, Sendable {
    let data: T?
    let timestamp: Date
    let source: String
    let cached: Bool?
    let error: String?
}

struct PaginatedResponse<T: Decodable & Sendable>: Decodable, Sendable {
    let data: [T]
    let total: Int
    let page: Int
    let pageSize: Int
    let hasMore: Bool
}
