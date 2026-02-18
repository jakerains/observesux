import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "RiversVM")

@Observable
@MainActor
final class RiversViewModel {
    var readings: [RiverGaugeReading] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.rivers))
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
            let response: ApiResponse<[RiverGaugeReading]> = try await APIClient.shared.fetch(Endpoints.rivers)
            readings = response.data ?? []
            lastUpdated = response.timestamp
            status = DataFreshness.status(
                lastUpdated: lastUpdated,
                refreshInterval: Endpoints.RefreshInterval.rivers
            )
            errorMessage = nil
        } catch {
            logger.error("Rivers fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if readings.isEmpty {
                status = .error(error.localizedDescription)
            }
        }
    }
}
