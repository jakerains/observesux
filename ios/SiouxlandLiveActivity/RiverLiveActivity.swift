import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - River Flood Watch Live Activity

struct RiverActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let gaugeHeight: Double
        let floodStage: String
        let trend: String?
    }

    let siteName: String
    let actionStage: Double?
    let floodStageLevel: Double?
}

struct RiverLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RiverActivityAttributes.self) { context in
            // Lock Screen
            HStack(spacing: 12) {
                Image(systemName: "water.waves")
                    .font(.title2)
                    .foregroundStyle(stageColor(context.state.floodStage))

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.siteName)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", context.state.gaugeHeight))
                            .font(.title2)
                            .bold()
                        Text("ft")
                            .font(.caption)

                        if let trend = context.state.trend {
                            Image(systemName: trend == "rising" ? "arrow.up" : trend == "falling" ? "arrow.down" : "minus")
                                .foregroundStyle(trend == "rising" ? .red : .green)
                        }
                    }

                    Text(context.state.floodStage.capitalized)
                        .font(.caption)
                        .foregroundStyle(stageColor(context.state.floodStage))
                }

                Spacer()
            }
            .padding()
            .activityBackgroundTint(.clear)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "water.waves")
                        .foregroundStyle(stageColor(context.state.floodStage))
                }

                DynamicIslandExpandedRegion(.center) {
                    Text(String(format: "%.1f ft", context.state.gaugeHeight))
                        .font(.title3)
                        .bold()
                }

                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.floodStage.capitalized)
                        .font(.caption)
                }
            } compactLeading: {
                Image(systemName: "water.waves")
                    .foregroundStyle(.blue)
            } compactTrailing: {
                Text(String(format: "%.1f'", context.state.gaugeHeight))
                    .bold()
            } minimal: {
                Image(systemName: "water.waves")
                    .foregroundStyle(.blue)
            }
        }
    }

    private func stageColor(_ stage: String) -> Color {
        switch stage {
        case "normal": .green
        case "action": .yellow
        case "minor": .orange
        case "moderate": .red
        case "major": .purple
        default: .gray
        }
    }
}
