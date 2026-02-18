import SwiftUI

struct GasPricesCard: View {
    let viewModel: GasPricesViewModel

    var body: some View {
        DashboardCard(
            title: "Gas Prices",
            icon: "fuelpump.fill",
            status: viewModel.status,
            onRefresh: { await viewModel.fetch() }
        ) {
            if let data = viewModel.data {
                VStack(alignment: .leading, spacing: 8) {
                    // Stats summary
                    if let stats = Optional(data.stats), let low = stats.lowestRegular {
                        HStack(spacing: 16) {
                            statItem("Low", value: low)
                            if let avg = stats.averageRegular { statItem("Avg", value: avg) }
                            if let high = stats.highestRegular { statItem("High", value: high) }
                        }
                    }

                    // Top cheapest stations
                    ForEach(data.stations.prefix(3)) { station in
                        stationRow(station)
                    }
                }
            }
        }
    }

    private func statItem(_ label: String, value: Double) -> some View {
        VStack(spacing: 2) {
            Text(label).slLabelStyle()
            Text(value, format: .currency(code: "USD"))
                .font(.slDataMedium)
                .bold()
        }
    }

    private func stationRow(_ station: GasStation) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(station.brandName)
                    .font(.slCompact)
                    .bold()
                Text(station.streetAddress)
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if let regular = station.prices.first(where: { $0.fuelType == .regular }) {
                Text(regular.price, format: .currency(code: "USD"))
                    .font(.slBody)
                    .bold()
                    .foregroundStyle(.green)
            }
        }
    }
}
