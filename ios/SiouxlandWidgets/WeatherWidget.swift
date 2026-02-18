import SwiftUI
import WidgetKit

// MARK: - Weather Home Screen Widget

struct WeatherEntry: TimelineEntry {
    let date: Date
    let temperature: Int?
    let conditions: String
    let icon: String
}

struct WeatherProvider: TimelineProvider {
    func placeholder(in context: Context) -> WeatherEntry {
        WeatherEntry(date: .now, temperature: 72, conditions: "Partly Cloudy", icon: "cloud.sun.fill")
    }

    func getSnapshot(in context: Context, completion: @escaping @Sendable (WeatherEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping @Sendable (Timeline<WeatherEntry>) -> Void) {
        Task { @Sendable in
            do {
                let response: WidgetApiResponse<WidgetWeather> = try await WidgetAPIClient.fetch(path: "/api/weather")
                let weather = response.data
                let entry = WeatherEntry(
                    date: .now,
                    temperature: weather?.temperature.map { Int($0) },
                    conditions: weather?.conditions ?? "Unknown",
                    icon: weatherSFSymbol(for: weather?.icon ?? weather?.conditions ?? "clear")
                )
                let nextUpdate = Date().addingTimeInterval(900) // 15 min
                completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
            } catch {
                let entry = WeatherEntry(date: .now, temperature: nil, conditions: "Unavailable", icon: "exclamationmark.triangle")
                completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(300))))
            }
        }
    }
}

struct WeatherWidgetView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: entry.icon)
                    .symbolRenderingMode(.multicolor)
                    .font(family == .systemSmall ? .title2 : .title)

                if family != .systemSmall {
                    Text("Sioux City")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }

            if let temp = entry.temperature {
                Text("\(temp)°")
                    .font(family == .systemSmall ? .title : .largeTitle)
                    .bold()
            }

            Text(entry.conditions)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct WeatherWidget: Widget {
    let kind = "WeatherWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherProvider()) { entry in
            WeatherWidgetView(entry: entry)
        }
        .configurationDisplayName("Weather")
        .description("Current conditions in Sioux City")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Local SF Symbol Mapping (widgets can't share main app extension)

private func weatherSFSymbol(for input: String) -> String {
    let lower = input.lowercased()
    if lower.contains("thunder") || lower.contains("tsra") { return "cloud.bolt.rain.fill" }
    if lower.contains("tornado") || lower.contains("funnel") { return "tornado" }
    if lower.contains("hurricane") || lower.contains("tropical") { return "hurricane" }
    if lower.contains("snow") || lower.contains("blizzard") || lower.contains("sn") { return "cloud.snow.fill" }
    if lower.contains("sleet") || lower.contains("ice") || lower.contains("fzra") { return "cloud.sleet.fill" }
    if lower.contains("rain") || lower.contains("shower") || lower.contains("ra") { return "cloud.rain.fill" }
    if lower.contains("drizzle") { return "cloud.drizzle.fill" }
    if lower.contains("fog") || lower.contains("mist") || lower.contains("haze") || lower.contains("fg") { return "cloud.fog.fill" }
    if lower.contains("overcast") || lower.contains("ovc") { return "cloud.fill" }
    if lower.contains("cloudy") || lower.contains("bkn") || lower.contains("sct") { return "cloud.sun.fill" }
    if lower.contains("few") { return "cloud.sun.fill" }
    if lower.contains("wind") { return "wind" }
    if lower.contains("clear") || lower.contains("sunny") || lower.contains("skc") || lower.contains("fair") { return "sun.max.fill" }
    return "cloud.sun.fill"
}
