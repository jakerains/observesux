import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "CouncilVM")

@Observable
@MainActor
final class CouncilViewModel {
    var meetings: [CouncilMeeting] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.council))
                await fetch()
            }
        }
    }

    func stopPolling() { pollingTask?.cancel() }

    func fetch() async {
        do {
            let response: ApiResponse<[CouncilMeeting]> = try await APIClient.shared.fetch(Endpoints.councilMeetings)
            meetings = response.data ?? []
            lastUpdated = response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.council)
            errorMessage = nil
        } catch {
            logger.error("Council meetings fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if meetings.isEmpty { status = .error(error.localizedDescription) }
        }
    }

    var latestMeeting: CouncilMeeting? { meetings.first }
}
