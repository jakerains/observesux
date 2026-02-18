import SwiftUI

struct CouncilCard: View {
    let viewModel: CouncilViewModel

    var body: some View {
        DashboardCard(
            title: "Council Meetings",
            icon: "building.columns.fill",
            status: viewModel.status,
            tier: .primary,
            onRefresh: { await viewModel.fetch() }
        ) {
            if let meeting = viewModel.latestMeeting {
                VStack(alignment: .leading, spacing: 8) {
                    Text(meeting.title)
                        .font(.slWidgetTitle)
                        .lineLimit(2)

                    Text(meeting.publishedAt.mediumDate)
                        .font(.slCompact)
                        .foregroundStyle(.secondary)

                    if let recap = meeting.recap {
                        Text(recap)
                            .font(.slBody)
                            .lineLimit(4)
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                EmptyStateView(icon: "building.columns", title: "No Meetings", message: "No council meeting data available")
            }
        }
    }
}
