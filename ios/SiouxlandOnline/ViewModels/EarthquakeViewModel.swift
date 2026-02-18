import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "EarthquakeVM")

@Observable
@MainActor
final class EarthquakeViewModel {
    var earthquakes: [Earthquake] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.earthquakes))
                await fetch()
            }
        }
    }

    func stopPolling() { pollingTask?.cancel() }

    func fetch() async {
        do {
            let response: ApiResponse<[Earthquake]> = try await APIClient.shared.fetch(Endpoints.earthquakes)
            earthquakes = response.data ?? []
            lastUpdated = response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.earthquakes)
            errorMessage = nil
        } catch {
            logger.error("Earthquake fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if earthquakes.isEmpty { status = .error(error.localizedDescription) }
        }
    }
}
