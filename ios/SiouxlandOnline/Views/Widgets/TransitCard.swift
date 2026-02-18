import SwiftUI

struct TransitCard: View {
    let viewModel: TransitViewModel

    var body: some View {
        DashboardCard(
            title: "Transit",
            icon: "bus.fill",
            status: viewModel.status,
            onRefresh: { await viewModel.fetch() }
        ) {
            if viewModel.buses.isEmpty && viewModel.status != .loading {
                EmptyStateView(
                    icon: "bus",
                    title: "No Active Buses",
                    message: "No buses are currently operating"
                )
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    // Summary
                    HStack {
                        Text("\(viewModel.activeBusCount)")
                            .font(.slDataLarge)
                            .bold()
                        Text("active buses")
                            .font(.slBody)
                            .foregroundStyle(.secondary)
                    }

                    // Bus list (compact)
                    ForEach(viewModel.buses.prefix(5)) { bus in
                        busRow(bus)
                    }
                }
            }
        }
    }

    private func busRow(_ bus: BusPosition) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(Color(hex: bus.routeColor ?? "#3b82f6"))
                .frame(width: 8, height: 8)

            Text(bus.routeName)
                .font(.slCompact)
                .bold()

            Spacer()

            if let stop = bus.currentStopName {
                Text(stop)
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            if let adherence = bus.scheduleAdherence {
                Text(adherence.rawValue)
                    .font(.slCompact)
                    .foregroundStyle(adherenceColor(adherence))
            }
        }
    }

    private func adherenceColor(_ adherence: ScheduleAdherence) -> Color {
        switch adherence {
        case .early: .blue
        case .onTime: .green
        case .late: .red
        case .unknown: .gray
        }
    }
}
