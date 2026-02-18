import Foundation

@Observable
@MainActor
final class StatusViewModel {
    var dashboardStatus: DashboardStatus?
    var status: DataStatus = .loading

    private var pollingTask: Task<Void, Never>?

    func startPolling() {
        pollingTask = Task {
            await fetch()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.status))
                await fetch()
            }
        }
    }

    func stopPolling() { pollingTask?.cancel() }

    func fetch() async {
        do {
            dashboardStatus = try await APIClient.shared.fetchData(Endpoints.status)
            status = .live
        } catch {
            status = .error(error.localizedDescription)
        }
    }
}
