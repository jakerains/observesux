import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Weather Live Activity

struct WeatherActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let temperature: Int
        let conditions: String
        let icon: String
        let windSpeed: Int?
        let humidity: Int?
    }

    let stationName: String
}

struct WeatherLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WeatherActivityAttributes.self) { context in
            // Lock Screen presentation
            HStack(spacing: 16) {
                Image(systemName: context.state.icon)
                    .font(.title)
                    .symbolRenderingMode(.multicolor)

                VStack(alignment: .leading) {
                    Text("\(context.state.temperature)°F")
                        .font(.title2)
                        .bold()

                    Text(context.state.conditions)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    if let wind = context.state.windSpeed {
                        Label("\(wind) mph", systemImage: "wind")
                            .font(.caption)
                    }
                    if let humidity = context.state.humidity {
                        Label("\(humidity)%", systemImage: "humidity")
                            .font(.caption)
                    }
                }
            }
            .padding()
            .activityBackgroundTint(.clear)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: context.state.icon)
                        .symbolRenderingMode(.multicolor)
                        .font(.title2)
                }

                DynamicIslandExpandedRegion(.center) {
                    Text("\(context.state.temperature)°F")
                        .font(.title2)
                        .bold()
                }

                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.conditions)
                        .font(.caption)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.attributes.stationName)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            } compactLeading: {
                Image(systemName: context.state.icon)
                    .symbolRenderingMode(.multicolor)
            } compactTrailing: {
                Text("\(context.state.temperature)°")
                    .bold()
            } minimal: {
                Image(systemName: context.state.icon)
                    .symbolRenderingMode(.multicolor)
            }
        }
    }
}
