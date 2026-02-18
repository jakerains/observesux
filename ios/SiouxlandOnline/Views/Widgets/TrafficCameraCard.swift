import SwiftUI

struct TrafficCameraCard: View {
    let camera: TrafficCamera

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Snapshot image
            if let snapshotUrl = camera.snapshotUrl, let url = URL(string: snapshotUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(16/9, contentMode: .fill)
                            .clipShape(.rect(cornerRadius: 10))
                    case .failure:
                        snapshotPlaceholder
                    case .empty:
                        ProgressView()
                            .frame(height: 120)
                    @unknown default:
                        snapshotPlaceholder
                    }
                }
            } else {
                snapshotPlaceholder
            }

            // Camera info
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(camera.name)
                        .font(.slCompact)
                        .bold()
                        .lineLimit(1)

                    if let roadway = camera.roadway {
                        Text(roadway)
                            .font(.slCompact)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                if camera.streamUrl != nil {
                    Image(systemName: "play.circle.fill")
                        .foregroundStyle(.slLive)
                }
            }
        }
        .padding(8)
        .glassCard(interactive: true)
    }

    private var snapshotPlaceholder: some View {
        Rectangle()
            .fill(.gray.opacity(0.2))
            .aspectRatio(16/9, contentMode: .fill)
            .overlay {
                Image(systemName: "video.slash")
                    .font(.title2)
                    .foregroundStyle(.secondary)
            }
            .clipShape(.rect(cornerRadius: 10))
    }
}
