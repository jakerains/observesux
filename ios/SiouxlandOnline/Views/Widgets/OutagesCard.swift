import SwiftUI

struct OutagesCard: View {
    let viewModel: OutagesViewModel

    var body: some View {
        DashboardCard(
            title: "Power Outages",
            icon: "bolt.trianglebadge.exclamationmark",
            status: viewModel.status,
            onRefresh: { await viewModel.fetch() }
        ) {
            if viewModel.outages.isEmpty {
                EmptyStateView(icon: "bolt.fill", title: "No Outages", message: "All systems operational")
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("\(viewModel.totalCustomersAffected) customers affected")
                        .font(.slBody)
                        .foregroundStyle(.slError)

                    ForEach(viewModel.outages.prefix(3)) { outage in
                        outageRow(outage)
                    }
                }
            }
        }
    }

    private func outageRow(_ outage: PowerOutage) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(outage.area)
                    .font(.slCompact)
                    .bold()
                Text("\(outage.customersAffected) customers")
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(outage.status.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                .font(.slCompact)
                .foregroundStyle(.orange)
        }
    }
}
