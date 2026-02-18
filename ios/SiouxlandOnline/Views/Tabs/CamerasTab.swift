import SwiftUI

// MARK: - Cameras Tab
// Grid of traffic camera snapshots with search and live video

struct CamerasTab: View {
    @State private var viewModel = CamerasViewModel()

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                switch viewModel.status {
                case .loading where viewModel.cameras.isEmpty:
                    loadingGrid
                case .error(let message) where viewModel.cameras.isEmpty:
                    ErrorStateView(message: message, onRetry: {
                        await viewModel.fetchCameras()
                    })
                default:
                    cameraGrid
                }
            }
            .refreshable {
                await viewModel.fetchCameras()
            }
            .searchable(text: $viewModel.searchText, prompt: "Search cameras")
            .navigationTitle("Cameras")
            .task {
                viewModel.startPolling()
            }
            .onDisappear {
                viewModel.stopPolling()
            }
        }
    }

    private var cameraGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(viewModel.filteredCameras) { camera in
                NavigationLink(value: camera.id) {
                    TrafficCameraCard(camera: camera)
                }
                .buttonStyle(.plain)
            }
        }
        .padding()
        .navigationDestination(for: String.self) { cameraId in
            if let camera = viewModel.cameras.first(where: { $0.id == cameraId }) {
                CameraDetailView(camera: camera)
            }
        }
    }

    private var loadingGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(0..<6, id: \.self) { _ in
                SkeletonCard()
            }
        }
        .padding()
    }
}

#Preview {
    CamerasTab()
}
