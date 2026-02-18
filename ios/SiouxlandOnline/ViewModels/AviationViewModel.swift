import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "AviationVM")

@Observable
@MainActor
final class AviationViewModel {
    var aviation: AviationWeather?
    var aircraftData: AircraftData?
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetchAll()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.aircraft))
                await fetchAll()
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
    }

    func fetchAll() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchAviation() }
            group.addTask { await self.fetchAircraft() }
        }
    }

    private func fetchAviation() async {
        do {
            let response: ApiResponse<AviationWeather> = try await APIClient.shared.fetch(Endpoints.aviation)
            aviation = response.data
            lastUpdated = response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.aircraft)
            errorMessage = nil
        } catch {
            logger.error("Aviation fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if aviation == nil { status = .error(error.localizedDescription) }
        }
    }

    private func fetchAircraft() async {
        do {
            let response: ApiResponse<AircraftData> = try await APIClient.shared.fetch(Endpoints.aircraft)
            aircraftData = response.data
        } catch {
            logger.warning("Aircraft fetch failed: \(error.localizedDescription)")
        }
    }
}
