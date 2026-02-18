import SwiftUI
import WidgetKit

struct AQIEntry: TimelineEntry {
    let date: Date
    let aqi: Int?
    let category: String
}

struct AQIProvider: TimelineProvider {
    func placeholder(in context: Context) -> AQIEntry {
        AQIEntry(date: .now, aqi: 42, category: "Good")
    }

    func getSnapshot(in context: Context, completion: @escaping @Sendable (AQIEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping @Sendable (Timeline<AQIEntry>) -> Void) {
        Task { @Sendable in
            do {
                let response: WidgetApiResponse<WidgetAQI> = try await WidgetAPIClient.fetch(path: "/api/air-quality")
                let entry = AQIEntry(
                    date: .now,
                    aqi: response.data?.aqi,
                    category: response.data?.category ?? "Unknown"
                )
                completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(1800))))
            } catch {
                completion(Timeline(entries: [AQIEntry(date: .now, aqi: nil, category: "Unavailable")], policy: .after(Date().addingTimeInterval(300))))
            }
        }
    }
}

struct AQIWidgetView: View {
    let entry: AQIEntry

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "aqi.medium")
                .font(.title2)

            if let aqi = entry.aqi {
                Text("\(aqi)")
                    .font(.title)
                    .bold()
            }

            Text(entry.category)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct AQIWidget: Widget {
    let kind = "AQIWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AQIProvider()) { entry in
            AQIWidgetView(entry: entry)
        }
        .configurationDisplayName("Air Quality")
        .description("Current AQI for Sioux City")
        .supportedFamilies([.systemSmall])
    }
}
