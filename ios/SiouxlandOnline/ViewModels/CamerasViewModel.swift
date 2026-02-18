import Foundation

@Observable
@MainActor
final class CamerasViewModel {
    var cameras: [TrafficCamera] = []
    var status: DataStatus = .loading
    var lastUpdated: Date?
    var searchText = ""
    var selectedCamera: TrafficCamera?

    private var pollingTask: Task<Void, Never>?

    var filteredCameras: [TrafficCamera] {
        if searchText.isEmpty {
            return cameras
        }
        return cameras.filter { camera in
            camera.name.localizedStandardContains(searchText)
                || (camera.roadway?.localizedStandardContains(searchText) ?? false)
                || (camera.description?.localizedStandardContains(searchText) ?? false)
        }
    }

    func startPolling() {
        pollingTask = Task {
            await fetchCameras()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Endpoints.RefreshInterval.cameras))
                await fetchCameras()
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func fetchCameras() async {
        do {
            let sources: [CameraSource] = try await APIClient.shared.fetchData(Endpoints.cameras)
            cameras = sources.flatMap(\.cameras).filter(\.isActive)
            lastUpdated = .now
            status = .live
        } catch {
            if cameras.isEmpty {
                status = .error(error.localizedDescription)
            }
        }
    }
}
