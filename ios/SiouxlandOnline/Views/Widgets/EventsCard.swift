import SwiftUI

struct EventsCard: View {
    let viewModel: EventsViewModel

    var body: some View {
        DashboardCard(
            title: "Events",
            icon: "calendar.badge.clock",
            status: viewModel.status,
            onRefresh: { await viewModel.fetch() }
        ) {
            if viewModel.events.isEmpty {
                EmptyStateView(icon: "calendar", title: "No Events", message: "No upcoming events")
            } else {
                VStack(spacing: 8) {
                    ForEach(viewModel.events.prefix(5)) { event in
                        eventRow(event)
                    }
                }
            }
        }
    }

    private func eventRow(_ event: CommunityEvent) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(event.title)
                .font(.slCompact)
                .bold()
                .lineLimit(1)

            HStack {
                Label(event.date, systemImage: "calendar")
                if let time = event.time {
                    Label(time, systemImage: "clock")
                }
                if let location = event.location {
                    Label(location, systemImage: "mappin")
                }
            }
            .font(.slCompact)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
        .padding(.vertical, 2)
    }
}
