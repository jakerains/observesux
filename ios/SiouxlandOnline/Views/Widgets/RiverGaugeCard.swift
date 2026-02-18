import SwiftUI

struct RiverGaugeCard: View {
    let viewModel: RiversViewModel

    var body: some View {
        DashboardCard(
            title: "Rivers",
            icon: "water.waves",
            status: viewModel.status,
            onRefresh: { await viewModel.fetch() }
        ) {
            if viewModel.readings.isEmpty && viewModel.status != .loading {
                EmptyStateView(icon: "water.waves", title: "No Data", message: "River gauge data unavailable")
            } else {
                VStack(spacing: 8) {
                    ForEach(viewModel.readings) { reading in
                        gaugeRow(reading)
                    }
                }
            }
        }
    }

    private func gaugeRow(_ reading: RiverGaugeReading) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(reading.siteName)
                    .font(.slCompact)
                    .bold()
                    .lineLimit(1)

                if let height = reading.gaugeHeight {
                    Text(String(format: "%.1f ft", height))
                        .font(.slBody)
                }
            }

            Spacer()

            FloodStageBadge(stage: reading.floodStage)

            if let trend = reading.trend {
                Image(systemName: trendIcon(trend))
                    .foregroundStyle(trendColor(trend))
            }
        }
        .padding(.vertical, 4)
    }

    private func trendIcon(_ trend: String) -> String {
        switch trend {
        case "rising": "arrow.up"
        case "falling": "arrow.down"
        default: "minus"
        }
    }

    private func trendColor(_ trend: String) -> Color {
        switch trend {
        case "rising": .red
        case "falling": .green
        default: .gray
        }
    }
}
