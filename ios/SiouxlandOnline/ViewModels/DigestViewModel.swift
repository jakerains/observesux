import Foundation
import os

private let logger = Logger(subsystem: "com.siouxlandonline.ios", category: "DigestVM")

struct DigestData: Decodable, Sendable {
    let content: String
    let generatedAt: Date
    let sections: [DigestSection]?
}

struct DigestSection: Decodable, Identifiable, Sendable {
    let title: String
    let content: String
    var id: String { title }
}

@Observable
@MainActor
final class DigestViewModel {
    var digest: DigestData?
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.digest))
                await fetch()
            }
        }
    }

    func stopPolling() { pollingTask?.cancel() }

    func fetch() async {
        do {
            let response: ApiResponse<DigestData> = try await APIClient.shared.fetch(Endpoints.digest)
            digest = response.data
            lastUpdated = response.timestamp
            status = DataFreshness.status(lastUpdated: lastUpdated, refreshInterval: Endpoints.RefreshInterval.digest)
            errorMessage = nil
        } catch {
            logger.error("Digest fetch failed: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if digest == nil { status = .error(error.localizedDescription) }
        }
    }
}
