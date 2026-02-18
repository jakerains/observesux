import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "FlightsVM")

@Observable
@MainActor
final class FlightsViewModel {
    var flights: [Flight] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    var arrivals: [Flight] { flights.filter { $0.type == .arrival } }
    var departures: [Flight] { flights.filter { $0.type == .departure } }

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.flights))
                await fetch()
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
    }

    func fetch() async {
        do {
            let response: ApiResponse<[Flight]> = try await APIClient.shared.fetch(Endpoints.flights)
            flights = response.data ?? []
            lastUpdated = response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.flights)
            errorMessage = nil
        } catch {
            logger.error("Flights fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if flights.isEmpty { status = .error(error.localizedDescription) }
        }
    }
}
