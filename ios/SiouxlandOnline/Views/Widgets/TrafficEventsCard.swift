import SwiftUI

struct TrafficEventsCard: View {
    let viewModel: TrafficEventsViewModel

    var body: some View {
        DashboardCard(
            title: "Traffic Events",
            icon: "car.fill",
            status: viewModel.status,
            onRefresh: { await viewModel.fetch() }
        ) {
            if viewModel.events.isEmpty {
                EmptyStateView(icon: "checkmark.circle", title: "All Clear", message: "No active traffic events")
            } else {
                VStack(spacing: 8) {
                    ForEach(viewModel.events.prefix(5)) { event in
                        eventRow(event)
                    }
                    if viewModel.events.count > 5 {
                        Text("+\(viewModel.events.count - 5) more")
                            .font(.slCompact)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private func eventRow(_ event: TrafficEvent) -> some View {
        HStack(spacing: 8) {
            SeverityBadge(severity: event.severity)

            VStack(alignment: .leading, spacing: 2) {
                Text(event.headline)
                    .font(.slCompact)
                    .bold()
                    .lineLimit(1)

                Text(event.roadway)
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
    }
}
