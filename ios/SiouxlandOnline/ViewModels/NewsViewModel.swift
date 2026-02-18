import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "NewsVM")

@Observable
@MainActor
final class NewsViewModel {
    var items: [NewsItem] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.news))
                await fetch()
            }
        }
    }

    func stopPolling() { pollingTask?.cancel() }

    func fetch() async {
        do {
            let response: ApiResponse<[NewsItem]> = try await APIClient.shared.fetch(Endpoints.news)
            items = response.data ?? []
            lastUpdated = response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.news)
            errorMessage = nil
        } catch {
            logger.error("News fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if items.isEmpty { status = .error(error.localizedDescription) }
        }
    }
}
