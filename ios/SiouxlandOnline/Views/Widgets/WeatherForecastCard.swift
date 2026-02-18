import SwiftUI

// MARK: - Weather Forecast Card
// Horizontal scroll of 7-day forecast periods + hourly

struct WeatherForecastCard: View {
    let forecast: WeatherForecast?
    let hourlyForecast: HourlyWeatherForecast?

    @State private var showHourly = false

    var body: some View {
        DashboardCard(
            title: showHourly ? "Hourly Forecast" : "7-Day Forecast",
            icon: "calendar",
            status: forecast != nil ? .live : .loading,
            tier: .primary
        ) {
            VStack(spacing: 12) {
                // Toggle
                togglePicker

                // Content
                if showHourly {
                    hourlyScrollView
                } else {
                    dailyScrollView
                }
            }
        }
    }

    // MARK: - Toggle

    private var togglePicker: some View {
        HStack(spacing: 0) {
            toggleButton("Daily", isSelected: !showHourly) {
                showHourly = false
            }
            toggleButton("Hourly", isSelected: showHourly) {
                showHourly = true
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

    // MARK: - Daily Forecast

    private var dailyScrollView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: 16) {
                if let periods = forecast?.periods {
                    ForEach(periods) { period in
                        dailyCell(period)
                    }
                }
            }
            .scrollTargetLayout()
        }
        .scrollTargetBehavior(.viewAligned)
    }

    private func dailyCell(_ period: ForecastPeriod) -> some View {
        VStack(spacing: 6) {
            Text(period.name)
                .font(.slCompact)
                .bold()
                .lineLimit(1)

            Image(systemName: period.icon.weatherSFSymbol)
                .font(.title2)
                .symbolRenderingMode(.multicolor)

            Text("\(period.temperature)°")
                .font(.slDataMedium)
                .bold()

            Text(period.shortForecast)
                .font(.slCompact)
                .foregroundStyle(.secondary)
                .lineLimit(2)
                .multilineTextAlignment(.center)

            if let pop = period.probabilityOfPrecipitation, pop > 0 {
                Label("\(pop)%", systemImage: "drop.fill")
                    .font(.slCompact)
                    .foregroundStyle(.blue)
            }
        }
        .frame(width: 90)
    }

    // MARK: - Hourly Forecast

    private var hourlyScrollView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: 12) {
                if let periods = hourlyForecast?.periods.prefix(24) {
                    ForEach(Array(periods.enumerated()), id: \.offset) { _, period in
                        hourlyCell(period)
                    }
                }
            }
            .scrollTargetLayout()
        }
        .scrollTargetBehavior(.viewAligned)
    }

    private func hourlyCell(_ period: HourlyForecast) -> some View {
        VStack(spacing: 4) {
            Text(period.startTime.timeString)
                .font(.slCompact)

            Image(systemName: period.icon.weatherSFSymbol)
                .symbolRenderingMode(.multicolor)

            Text("\(period.temperature)°")
                .font(.slBody)
                .bold()

            if let pop = period.probabilityOfPrecipitation, pop > 0 {
                Label("\(pop)%", systemImage: "drop.fill")
                    .font(.slCompact)
                    .foregroundStyle(.blue)
            }
        }
        .frame(width: 60)
    }
}
