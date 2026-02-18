import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "TransitVM")

@Observable
@MainActor
final class TransitViewModel {
    var buses: [BusPosition] = []
    var routes: [TransitRoute] = []
    var activeBusCount = 0
    var activeRoutes: [String] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.transit))
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
            let data: TransitData = try await APIClient.shared.fetchData(Endpoints.transit)
            buses = data.buses
            routes = data.routes
            activeBusCount = data.activeBusCount
            activeRoutes = data.activeRoutes
            lastUpdated = data.timestamp
            status = DataFreshness.status(
                lastUpdated: lastUpdated,
                refreshInterval: Endpoints.RefreshInterval.transit
            )
            errorMessage = nil
        } catch {
            logger.error("Transit fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if buses.isEmpty {
                status = .error(error.localizedDescription)
            }
        }
    }
}
