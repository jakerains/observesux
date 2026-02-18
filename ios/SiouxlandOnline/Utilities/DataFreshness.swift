import Foundation

// MARK: - Data Freshness Calculation
// Mirrors the web app's getDataFreshness() logic

enum DataStatus: Sendable, Equatable {
    case live
    case stale
    case error(String)
    case loading

    var label: String {
        switch self {
        case .live: "Live"
        case .stale: "Stale"
        case .error: "Error"
        case .loading: "Loading"
        }
    }
}

enum DataFreshness {
    /// Determine if data is live or stale.
    /// Threshold: stale after `refreshInterval * 3`
    static func status(
        lastUpdated: Date?,
        refreshInterval: TimeInterval
    ) -> DataStatus {
        guard let lastUpdated else { return .loading }

        let elapsed = Date.now.timeIntervalSince(lastUpdated)
        let threshold = refreshInterval * 3

        return elapsed > threshold ? .stale : .live
    }
}
