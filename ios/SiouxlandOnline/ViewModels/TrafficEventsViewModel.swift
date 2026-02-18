import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "TrafficEventsVM")

@Observable
@MainActor
final class TrafficEventsViewModel {
    var events: [TrafficEvent] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.traffic))
                await fetch()
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func fetch() async {
        do {
            let response: ApiResponse<[TrafficEvent]> = try await APIClient.shared.fetch(Endpoints.trafficEvents)
            events = response.data ?? []
            lastUpdated = response.timestamp
            status = DataFreshness.status(
                lastUpdated: lastUpdated,
                refreshInterval: Endpoints.RefreshInterval.traffic
            )
            errorMessage = nil
        } catch {
            logger.error("Traffic events fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if events.isEmpty {
                status = .error(error.localizedDescription)
            }
        }
    }
}
