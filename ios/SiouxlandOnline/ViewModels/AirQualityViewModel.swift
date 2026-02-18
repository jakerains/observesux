import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "AirQualityVM")

@Observable
@MainActor
final class AirQualityViewModel {
    var reading: AirQualityReading?
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.airQuality))
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
            let response: ApiResponse<AirQualityReading> = try await APIClient.shared.fetch(Endpoints.airQuality)
            reading = response.data
            lastUpdated = response.timestamp
            status = DataFreshness.status(
                lastUpdated: lastUpdated,
                refreshInterval: Endpoints.RefreshInterval.airQuality
            )
            errorMessage = nil
        } catch {
            logger.error("Air quality fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if reading == nil {
                status = .error(error.localizedDescription)
            }
        }
    }
}
