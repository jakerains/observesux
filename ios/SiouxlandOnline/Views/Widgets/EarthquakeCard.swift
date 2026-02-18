import SwiftUI

struct EarthquakeCard: View {
    let viewModel: EarthquakeViewModel

    var body: some View {
        DashboardCard(
            title: "Earthquakes",
            icon: "waveform.path.ecg",
            status: viewModel.status,
            tier: .compact,
            onRefresh: { await viewModel.fetch() }
        ) {
            if viewModel.earthquakes.isEmpty {
                EmptyStateView(icon: "waveform.path.ecg", title: "No Activity", message: "No recent seismic activity")
            } else {
                VStack(spacing: 8) {
                    ForEach(viewModel.earthquakes.prefix(5)) { quake in
                        quakeRow(quake)
                    }
                }
            }
        }
    }

    private func quakeRow(_ quake: Earthquake) -> some View {
        HStack {
            // Magnitude circle
            Text(String(format: "%.1f", quake.magnitude))
                .font(.slCompact)
                .bold()
                .foregroundStyle(.white)
                .frame(width: 32, height: 32)
                .background(magnitudeColor(quake.magnitude), in: Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(quake.location)
                    .font(.slCompact)
                    .bold()
                    .lineLimit(1)

                Text("\(String(format: "%.0f", quake.depth)) km deep · \(quake.time.relativeShort)")
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
    }

    private func magnitudeColor(_ mag: Double) -> Color {
        switch mag {
        case ..<2.0: .green
        case 2.0..<4.0: .yellow
        case 4.0..<6.0: .orange
        default: .red
        }
    }
}
