import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "GasPricesVM")

@Observable
@MainActor
final class GasPricesViewModel {
    var data: GasPriceData?
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.gasPrices))
                await fetch()
            }
        }
    }

    func stopPolling() { pollingTask?.cancel() }

    func fetch() async {
        do {
            let response: ApiResponse<GasPriceData> = try await APIClient.shared.fetch(Endpoints.gasPrices)
            data = response.data
            lastUpdated = response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.gasPrices)
            errorMessage = nil
        } catch {
            logger.error("Gas prices fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if data == nil { status = .error(error.localizedDescription) }
        }
    }
}
