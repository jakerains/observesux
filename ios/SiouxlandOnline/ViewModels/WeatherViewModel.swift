import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "WeatherVM")

@Observable
@MainActor
final class WeatherViewModel {
    // Data
    var observation: WeatherObservation?
    var forecast: WeatherForecast?
    var hourlyForecast: HourlyWeatherForecast?
    var alerts: [WeatherAlert] = []

    // State
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    // Polling
    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        stopPolling()
        pollingTask = Task {
            await fetchAll()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.weather))
                await fetchAll()
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func fetchAll() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchObservation() }
            group.addTask { await self.fetchForecast() }
            group.addTask { await self.fetchAlerts() }
            group.addTask { await self.fetchHourly() }
        }
    }

    func fetchObservation() async {
        do {
            let response: ApiResponse<WeatherObservation> = try await APIClient.shared.fetch(Endpoints.weather)
            observation = response.data
            lastUpdated = response.timestamp
            status = DataFreshness.status(
                lastUpdated: lastUpdated,
                refreshInterval: Endpoints.RefreshInterval.weather
            )
            errorMessage = nil
        } catch {
            logger.error("Weather observation fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            // Keep showing stale data if we have it
            if observation == nil {
                status = .error(error.localizedDescription)
            }
        }
    }

    private func fetchForecast() async {
        do {
            forecast = try await APIClient.shared.fetchData(Endpoints.weatherForecast)
        } catch {
            logger.warning("Forecast fetch failed: \(error.localizedDescription)")
        }
    }

    private func fetchHourly() async {
        do {
            hourlyForecast = try await APIClient.shared.fetchData(Endpoints.weatherHourly)
        } catch {
            logger.warning("Hourly forecast fetch failed: \(error.localizedDescription)")
        }
    }

    private func fetchAlerts() async {
        do {
            alerts = try await APIClient.shared.fetchData(Endpoints.weatherAlerts)
        } catch {
            logger.warning("Weather alerts fetch failed: \(error.localizedDescription)")
        }
    }
}
