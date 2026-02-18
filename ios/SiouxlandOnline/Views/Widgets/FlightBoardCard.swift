import SwiftUI

struct FlightBoardCard: View {
    let viewModel: FlightsViewModel

    @State private var showArrivals = true

    var body: some View {
        DashboardCard(
            title: "SUX Flights",
            icon: "airplane",
            status: viewModel.status,
            tier: .compact,
            onRefresh: { await viewModel.fetch() }
        ) {
            VStack(spacing: 8) {
                // Toggle arrivals/departures
                HStack(spacing: 0) {
                    toggleButton("Arrivals (\(viewModel.arrivals.count))", isSelected: showArrivals) {
                        showArrivals = true
                    }
                    toggleButton("Departures (\(viewModel.departures.count))", isSelected: !showArrivals) {
                        showArrivals = false
                    }
                }

                // Flight list
                let flights = showArrivals ? viewModel.arrivals : viewModel.departures
                if flights.isEmpty {
                    Text("No \(showArrivals ? "arrivals" : "departures") scheduled")
                        .font(.slCompact)
                        .foregroundStyle(.secondary)
                        .padding()
                } else {
                    ForEach(flights) { flight in
                        flightRow(flight)
                    }
                }
            }
        }
    }

    private func toggleButton(_ title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.slCompact)
                .bold()
                .foregroundStyle(isSelected ? .primary : .secondary)
                .glassPill(isSelected: isSelected)
        }
        .buttonStyle(.plain)
    }

    private func flightRow(_ flight: Flight) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(flight.flightNumber)
                    .font(.slCompact)
                    .bold()

                Text(flight.airline)
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(flight.scheduledTime.timeString)
                    .font(.slCompact)

                Text(flight.status.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.slCompact)
                    .foregroundStyle(flightStatusColor(flight.status))
            }
        }
        .padding(.vertical, 2)
    }

    private func flightStatusColor(_ status: FlightStatus) -> Color {
        switch status {
        case .scheduled, .boarding: .blue
        case .departed, .inAir: .green
        case .landed, .arrived: .slLive
        case .delayed: .orange
        case .cancelled: .red
        }
    }
}
