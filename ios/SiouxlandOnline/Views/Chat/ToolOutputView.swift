import SwiftUI

// MARK: - Tool Output View
// Renders tool call results as rich cards

struct ToolOutputView: View {
    let toolCall: ToolCall

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Tool header
            HStack(spacing: 6) {
                Image(systemName: toolIcon)
                    .foregroundStyle(.slWarmAmber)
                Text(toolDisplayName)
                    .font(.slCompact)
                    .bold()

                Spacer()

                if toolCall.result == nil {
                    ProgressView()
                        .scaleEffect(0.7)
                }
            }

            // Result content
            if let result = toolCall.result {
                if result.isError {
                    Text(result.content)
                        .font(.slCompact)
                        .foregroundStyle(.red)
                } else {
                    Text(result.content)
                        .font(.slCompact)
                        .foregroundStyle(.secondary)
                        .lineLimit(6)
                }
            }
        }
        .padding(12)
        .glassCard()
    }

    private var toolIcon: String {
        switch toolCall.name {
        case "get_weather", "weather": "cloud.sun.fill"
        case "get_traffic", "traffic": "car.fill"
        case "get_gas_prices", "gas_prices": "fuelpump.fill"
        case "get_rivers", "rivers": "water.waves"
        case "get_flights", "flights": "airplane"
        case "get_air_quality", "air_quality": "aqi.medium"
        case "get_transit", "transit": "bus.fill"
        case "get_events", "events": "calendar"
        case "get_news", "news": "newspaper.fill"
        default: "wrench.fill"
        }
    }

    private var toolDisplayName: String {
        toolCall.name
            .replacingOccurrences(of: "get_", with: "")
            .replacingOccurrences(of: "_", with: " ")
            .capitalized
    }
}
