import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Weather Alert Live Activity

struct AlertActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let event: String
        let headline: String
        let severity: String
        let expires: Date
    }

    let alertId: String
}

struct AlertLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AlertActivityAttributes.self) { context in
            // Lock Screen
            HStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.title2)
                    .foregroundStyle(severityColor(context.state.severity))

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.state.event)
                        .font(.headline)
                        .foregroundStyle(severityColor(context.state.severity))

                    Text(context.state.headline)
                        .font(.caption)
                        .lineLimit(2)
                }

                Spacer()
            }
            .padding()
            .activityBackgroundTint(severityColor(context.state.severity).opacity(0.1))

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(severityColor(context.state.severity))
                }

                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.event)
                        .font(.headline)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.headline)
                        .font(.caption)
                        .lineLimit(2)
                }
            } compactLeading: {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
            } compactTrailing: {
                Text(context.state.event)
                    .font(.caption2)
                    .lineLimit(1)
            } minimal: {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
            }
        }
    }

    private func severityColor(_ severity: String) -> Color {
        switch severity {
        case "Extreme": Color(red: 0.5, green: 0, blue: 0.13)
        case "Severe": .red
        case "Moderate": .orange
        default: .yellow
        }
    }
}
