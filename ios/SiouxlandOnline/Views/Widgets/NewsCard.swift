import SwiftUI

struct NewsCard: View {
    let viewModel: NewsViewModel

    var body: some View {
        DashboardCard(
            title: "News",
            icon: "newspaper.fill",
            status: viewModel.status,
            tier: .primary,
            onRefresh: { await viewModel.fetch() }
        ) {
            VStack(spacing: 8) {
                ForEach(viewModel.items.prefix(5)) { item in
                    newsRow(item)
                }
            }
        }
    }

    private func newsRow(_ item: NewsItem) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                if item.isBreaking == true {
                    Text("BREAKING")
                        .font(.slCompact)
                        .bold()
                        .foregroundStyle(.red)
                }

                Text(item.source)
                    .font(.slCompact)
                    .foregroundStyle(.secondary)

                Spacer()

                Text(item.pubDate.relativeShort)
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }

            Text(item.title)
                .font(.slBody)
                .lineLimit(2)
        }
        .padding(.vertical, 4)
    }
}
