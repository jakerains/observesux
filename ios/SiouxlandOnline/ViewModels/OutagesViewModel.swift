import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "OutagesVM")

@Observable
@MainActor
final class OutagesViewModel {
    var outages: [PowerOutage] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.outages))
                await fetch()
            }
        }
    }

    func stopPolling() { pollingTask?.cancel() }

    func fetch() async {
        do {
            let response: ApiResponse<[PowerOutage]> = try await APIClient.shared.fetch(Endpoints.outages)
            outages = response.data ?? []
            lastUpdated = response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.outages)
            errorMessage = nil
        } catch {
            logger.error("Outages fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if outages.isEmpty { status = .error(error.localizedDescription) }
        }
    }

    var totalCustomersAffected: Int {
        outages.reduce(0) { $0 + $1.customersAffected }
    }
}
