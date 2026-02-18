import SwiftUI

struct CameraDetailView: View {
    let camera: TrafficCamera
    @State private var showLiveVideo = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Video / Snapshot
                if showLiveVideo, let streamUrl = camera.streamUrl, let url = URL(string: streamUrl) {
                    HLSPlayerView(url: url)
                        .aspectRatio(16/9, contentMode: .fit)
                        .clipShape(.rect(cornerRadius: 12))
                } else if let snapshotUrl = camera.snapshotUrl, let url = URL(string: snapshotUrl) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(16/9, contentMode: .fit)
                                .clipShape(.rect(cornerRadius: 12))
                        default:
                            ProgressView()
                                .frame(height: 200)
                        }
                    }
                }

                // Toggle
                if camera.streamUrl != nil {
                    Button {
                        showLiveVideo.toggle()
                    } label: {
                        Label(
                            showLiveVideo ? "Show Snapshot" : "Watch Live",
                            systemImage: showLiveVideo ? "photo" : "play.fill"
                        )
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.slWarmAmber)
                }

                // Info
                VStack(alignment: .leading, spacing: 8) {
                    if let roadway = camera.roadway {
                        Label(roadway, systemImage: "road.lanes")
                            .font(.slBody)
                    }
                    if let direction = camera.direction {
                        Label(direction, systemImage: "arrow.triangle.turn.up.right.diamond")
                            .font(.slBody)
                    }
                    if let desc = camera.description {
                        Text(desc)
                            .font(.slBody)
                            .foregroundStyle(.secondary)
                    }
                    Text("Last updated: \(camera.lastUpdated.relativeShort)")
                        .font(.slCompact)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .glassCard()
            }
            .padding()
        }
        .navigationTitle(camera.name)
    }
}
