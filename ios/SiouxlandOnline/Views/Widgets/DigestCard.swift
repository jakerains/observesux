import SwiftUI

struct DigestCard: View {
    let viewModel: DigestViewModel

    var body: some View {
        DashboardCard(
            title: "Daily Digest",
            icon: "doc.text.fill",
            status: viewModel.status,
            tier: .primary,
            onRefresh: { await viewModel.fetch() }
        ) {
            if let digest = viewModel.digest {
                VStack(alignment: .leading, spacing: 8) {
                    Text(digest.content)
                        .font(.slBody)
                        .lineLimit(6)

                    Text("Generated \(digest.generatedAt.relativeShort)")
                        .font(.slCompact)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
