import SwiftUI

struct WeatherAlertBanner: View {
    let alert: WeatherAlert

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: iconName)
                .font(.title3)
                .foregroundStyle(severityColor)

            VStack(alignment: .leading, spacing: 2) {
                Text(alert.event)
                    .font(.slWidgetTitle)
                    .foregroundStyle(severityColor)

                Text(alert.headline)
                    .font(.slCompact)
                    .lineLimit(2)
            }

            Spacer()

            Text("Expires \(alert.expires.relativeShort)")
                .font(.slCompact)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(severityColor.opacity(0.1))
        .warmCard(.secondary)
    }

    private var iconName: String {
        switch alert.severity {
        case .extreme: "exclamationmark.octagon.fill"
        case .severe: "exclamationmark.triangle.fill"
        case .moderate: "exclamationmark.circle.fill"
        case .minor: "info.circle.fill"
        }
    }

    private var severityColor: Color {
        switch alert.severity {
        case .extreme: .slSeverityCritical
        case .severe: .red
        case .moderate: .orange
        case .minor: .yellow
        }
    }
}
