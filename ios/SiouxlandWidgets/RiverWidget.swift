import SwiftUI
import WidgetKit

struct RiverEntry: TimelineEntry {
    let date: Date
    let siteName: String?
    let gaugeHeight: Double?
    let floodStage: String
}

struct RiverProvider: TimelineProvider {
    func placeholder(in context: Context) -> RiverEntry {
        RiverEntry(date: .now, siteName: "Missouri River", gaugeHeight: 12.5, floodStage: "normal")
    }

    func getSnapshot(in context: Context, completion: @escaping @Sendable (RiverEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping @Sendable (Timeline<RiverEntry>) -> Void) {
        Task { @Sendable in
            do {
                let response: WidgetApiResponse<[WidgetRiver]> = try await WidgetAPIClient.fetch(path: "/api/rivers")
                let river = response.data?.first
                let entry = RiverEntry(
                    date: .now,
                    siteName: river?.siteName,
                    gaugeHeight: river?.gaugeHeight,
                    floodStage: river?.floodStage ?? "unknown"
                )
                completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(1800))))
            } catch {
                completion(Timeline(entries: [RiverEntry(date: .now, siteName: nil, gaugeHeight: nil, floodStage: "unknown")], policy: .after(Date().addingTimeInterval(300))))
            }
        }
    }
}

struct RiverWidgetView: View {
    let entry: RiverEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Image(systemName: "water.waves")
                .font(.title2)
                .foregroundStyle(.blue)

            if let name = entry.siteName {
                Text(name)
                    .font(.caption)
                    .lineLimit(1)
            }

            if let height = entry.gaugeHeight {
                Text(String(format: "%.1f ft", height))
                    .font(.title2)
                    .bold()
            }

            Text(entry.floodStage.capitalized)
                .font(.caption)
                .foregroundStyle(stageColor)
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var stageColor: Color {
        switch entry.floodStage {
        case "normal": .green
        case "action": .yellow
        case "minor": .orange
        case "moderate": .red
        case "major": .purple
        default: .gray
        }
    }
}

struct RiverWidget: Widget {
    let kind = "RiverWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RiverProvider()) { entry in
            RiverWidgetView(entry: entry)
        }
        .configurationDisplayName("River Level")
        .description("River gauge readings")
        .supportedFamilies([.systemSmall])
    }
}
