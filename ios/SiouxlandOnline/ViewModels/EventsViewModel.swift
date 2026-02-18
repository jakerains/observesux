import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "EventsVM")

@Observable
@MainActor
final class EventsViewModel {
    var events: [CommunityEvent] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.events))
                await fetch()
            }
        }
    }

    func stopPolling() { pollingTask?.cancel() }

    func fetch() async {
        do {
            let response: ApiResponse<CommunityEventsData> = try await APIClient.shared.fetch(Endpoints.events)
            events = response.data?.events ?? []
            lastUpdated = response.data?.fetchedAt ?? response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.events)
            errorMessage = nil
        } catch {
            logger.error("Events fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if events.isEmpty { status = .error(error.localizedDescription) }
        }
    }
}
