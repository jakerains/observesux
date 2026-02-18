import SwiftUI

struct AirQualityCard: View {
    let viewModel: AirQualityViewModel

    var body: some View {
        DashboardCard(
            title: "Air Quality",
            icon: "aqi.medium",
            status: viewModel.status,
            onRefresh: { await viewModel.fetch() }
        ) {
            if let reading = viewModel.reading {
                HStack(spacing: 16) {
                    AQIRing(value: reading.aqi, category: reading.category)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(reading.category.rawValue)
                            .font(.slWidgetTitle)
                            .foregroundStyle(reading.category.color)

                        Text("Primary: \(reading.primaryPollutant)")
                            .font(.slCompact)
                            .foregroundStyle(.secondary)

                        if let pm25 = reading.pm25 {
                            Text("PM2.5: \(String(format: "%.1f", pm25)) µg/m³")
                                .font(.slCompact)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()
                }
            }
        }
    }
}
