import SwiftUI

struct AviationWeatherCard: View {
    let viewModel: AviationViewModel

    var body: some View {
        DashboardCard(
            title: "KSUX Aviation",
            icon: "airplane.circle",
            status: viewModel.status,
            tier: .compact,
            onRefresh: { await viewModel.fetchAll() }
        ) {
            VStack(alignment: .leading, spacing: 12) {
                if let metar = viewModel.aviation?.metar {
                    metarSection(metar)
                }

                if let data = viewModel.aircraftData {
                    aircraftSummary(data)
                }
            }
        }
    }

    private func metarSection(_ metar: METAR) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Flight category badge
            HStack {
                Text(metar.flightCategory.rawValue)
                    .font(.slWidgetTitle)
                    .bold()
                    .foregroundStyle(metar.flightCategory.color)

                Spacer()

                Text(metar.observationTime.relativeShort)
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }

            // Raw METAR
            Text(metar.rawOb)
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(.secondary)
                .lineLimit(3)

            // Key data
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 4) {
                if let vis = metar.visibility {
                    metarItem("Visibility", value: "\(String(format: "%.0f", vis)) SM")
                }
                if let ceiling = metar.ceiling {
                    metarItem("Ceiling", value: "\(ceiling) ft")
                }
                if let wind = metar.windSpeed {
                    let dir = metar.windDirection.map { "\($0)°" } ?? "VRB"
                    metarItem("Wind", value: "\(dir) \(wind) kt")
                }
                if let alt = metar.altimeter {
                    metarItem("Altimeter", value: String(format: "%.2f\"", alt))
                }
            }
        }
    }

    private func metarItem(_ label: String, value: String) -> some View {
        VStack(spacing: 1) {
            Text(label).slLabelStyle()
            Text(value).font(.slCompact).bold()
        }
    }

    private func aircraftSummary(_ data: AircraftData) -> some View {
        HStack(spacing: 16) {
            statPill("Nearby", count: data.nearSux, icon: "airplane")
            statPill("Arriving", count: data.suxArrivals, icon: "airplane.arrival")
            statPill("Departing", count: data.suxDepartures, icon: "airplane.departure")
        }
    }

    private func statPill(_ label: String, count: Int, icon: String) -> some View {
        VStack(spacing: 2) {
            Image(systemName: icon)
                .font(.caption)
            Text("\(count)")
                .font(.slCompact)
                .bold()
            Text(label)
                .font(.slCompact)
                .foregroundStyle(.secondary)
        }
    }
}
