import SwiftUI

struct ScannerCard: View {
    @State private var feeds: [ScannerFeed] = []
    @State private var status: DataStatus = .loading
    @State private var activeFeed: ScannerFeed?

    var body: some View {
        DashboardCard(
            title: "Police Scanner",
            icon: "antenna.radiowaves.left.and.right",
            status: status,
            tier: .compact,
            onRefresh: { await fetch() }
        ) {
            VStack(spacing: 8) {
                ForEach(feeds) { feed in
                    feedRow(feed)
                }

                if let activeFeed, let url = URL(string: "https://broadcastify.cdnstream1.com/\(activeFeed.feedId)") {
                    HLSPlayerView(url: url, isAudio: true)
                }
            }
        }
        .task { await fetch() }
    }

    private func feedRow(_ feed: ScannerFeed) -> some View {
        Button {
            activeFeed = activeFeed?.id == feed.id ? nil : feed
        } label: {
            HStack {
                Image(systemName: feedIcon(feed.type))
                    .foregroundStyle(.slWarmAmber)

                VStack(alignment: .leading, spacing: 2) {
                    Text(feed.name)
                        .font(.slCompact)
                        .bold()
                    Text(feed.description)
                        .font(.slCompact)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                if feed.isLive {
                    StatusBadge(status: .live)
                }

                if let listeners = feed.listeners {
                    Label("\(listeners)", systemImage: "headphones")
                        .font(.slCompact)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func feedIcon(_ type: ScannerFeedType) -> String {
        switch type {
        case .police: "shield.fill"
        case .fire: "flame.fill"
        case .ems: "cross.fill"
        case .aviation: "airplane"
        case .combined: "antenna.radiowaves.left.and.right"
        }
    }

    private func fetch() async {
        do {
            let response: ApiResponse<[ScannerFeed]> = try await APIClient.shared.fetch(Endpoints.scanner)
            feeds = response.data ?? []
            status = .live
        } catch {
            if feeds.isEmpty { status = .error(error.localizedDescription) }
        }
    }
}
