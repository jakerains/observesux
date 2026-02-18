import Foundation

struct DashboardWidgetStatus: Decodable, Sendable {
    let name: String
    let status: String // live, stale, error, loading
    let lastUpdated: Date?
    let error: String?
}

struct DashboardStatus: Decodable, Sendable {
    let widgets: [String: DashboardWidgetStatus]
    let overallStatus: String // healthy, degraded, error
}
