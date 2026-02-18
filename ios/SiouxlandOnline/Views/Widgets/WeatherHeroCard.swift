import SwiftUI

// MARK: - Weather Hero Card
// Full-width hero matching web's CurrentConditionsHero:
// Gradient background, giant thin temperature, metric row, inline badges

struct WeatherHeroCard: View {
    let observation: WeatherObservation?
    let alerts: [WeatherAlert]
    let status: DataStatus
    let onRefresh: () async -> Void

    @State private var isRefreshing = false

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Dynamic gradient background
            weatherGradient
                .overlay(
                    // Dark overlay for text readability
                    LinearGradient(
                        colors: [.black.opacity(0.1), .black.opacity(0.45)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )

            // Content overlay
            VStack(alignment: .leading, spacing: 0) {
                // Top bar: location + status + refresh
                topBar

                Spacer()

                if let obs = observation {
                    weatherContent(obs)
                } else {
                    loadingContent
                }
            }
            .padding(24)
        }
        .frame(minHeight: 320)
        .clipShape(.rect(cornerRadius: 24))
        .shadow(color: .black.opacity(0.15), radius: 20, y: 10)
        .shadow(color: .black.opacity(0.10), radius: 8, y: 4)
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            Text("SIOUX CITY, IOWA")
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.5)
                .foregroundStyle(.white.opacity(0.8))

            Spacer()

            StatusBadge(status: status)

            Button {
                Task {
                    isRefreshing = true
                    await onRefresh()
                    isRefreshing = false
                }
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white.opacity(0.7))
                    .rotationEffect(.degrees(isRefreshing ? 360 : 0))
                    .animation(isRefreshing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: isRefreshing)
            }
        }
    }

    // MARK: - Weather Content

    private func weatherContent(_ obs: WeatherObservation) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Alert banner (if any)
            if let alert = alerts.first {
                alertPill(alert)
            }

            // Giant temperature
            if let temp = obs.temperature {
                Text("\(Int(temp))\u{00B0}")
                    .font(.system(size: 96, weight: .ultraLight))
                    .tracking(-4)
                    .foregroundStyle(.white)
            }

            // Conditions
            Text(obs.conditions)
                .font(.system(size: 20, weight: .medium))
                .foregroundStyle(.white.opacity(0.9))

            if let feelsLike = obs.windChill ?? obs.heatIndex {
                Text("Feels like \(Int(feelsLike))\u{00B0}")
                    .font(.system(size: 14))
                    .foregroundStyle(.white.opacity(0.7))
            }

            // Metric row
            metricRow(obs)
        }
    }

    // MARK: - Metric Row

    private func metricRow(_ obs: WeatherObservation) -> some View {
        HStack(spacing: 16) {
            metricItem(icon: "wind", label: formatWind(obs))
            metricItem(icon: "humidity.fill", label: obs.humidity.map { "\(Int($0))%" } ?? "--")
            metricItem(icon: "eye.fill", label: obs.visibility.map { "\(Int($0)) mi" } ?? "--")
        }
        .padding(.top, 8)
    }

    private func metricItem(icon: String, label: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundStyle(.white.opacity(0.7))
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.9))
        }
    }

    private func formatWind(_ obs: WeatherObservation) -> String {
        guard let speed = obs.windSpeed else { return "Calm" }
        let dir = obs.windDirection ?? ""
        if let gust = obs.windGust {
            return "\(dir) \(Int(speed))g\(Int(gust))"
        }
        return "\(dir) \(Int(speed)) mph"
    }

    // MARK: - Alert Pill

    private func alertPill(_ alert: WeatherAlert) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 11))
            Text(alert.headline)
                .font(.system(size: 11, weight: .semibold))
                .lineLimit(1)
        }
        .foregroundStyle(alertColor(alert.severity))
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .tintedBadge(color: alertColor(alert.severity))
    }

    private func alertColor(_ severity: AlertSeverity) -> Color {
        switch severity {
        case .minor: .yellow
        case .moderate: .orange
        case .severe: .red
        case .extreme: .slSeverityCritical
        }
    }

    // MARK: - Loading Content

    private var loadingContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            SkeletonView(height: 80, width: 150)
            SkeletonView(height: 20, width: 200)
            SkeletonView(height: 16, width: 120)
        }
    }

    // MARK: - Gradient

    private var weatherGradient: LinearGradient {
        guard let obs = observation else {
            return WeatherGradients.gradient(for: "clear", isDaytime: true)
        }
        let hour = Calendar.current.component(.hour, from: .now)
        let isDaytime = (6...20).contains(hour)
        return WeatherGradients.gradient(for: obs.conditions, isDaytime: isDaytime)
    }
}
