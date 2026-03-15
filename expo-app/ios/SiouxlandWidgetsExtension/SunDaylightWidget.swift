import SwiftUI
import WidgetKit

struct SunDaylightEntry: TimelineEntry {
  let date: Date
  let payload: SunWidgetPayload?
  let snapshot: SunComputedSnapshot
  let fetchErrorDescription: String?

  var isDaylight: Bool { snapshot.phase == .daylight }
  var deepLink: URL? { URL(string: "siouxland://sun") }
}

struct SunDaylightProvider: TimelineProvider {
  func placeholder(in context: Context) -> SunDaylightEntry {
    .placeholder()
  }

  func getSnapshot(in context: Context, completion: @escaping (SunDaylightEntry) -> Void) {
    Task {
      completion(await loadEntry())
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SunDaylightEntry>) -> Void) {
    Task {
      let entry = await loadEntry()
      completion(Timeline(entries: [entry], policy: .after(entry.snapshot.nextRefresh)))
    }
  }

  private func loadEntry(now: Date = .now) async -> SunDaylightEntry {
    do {
      guard
        let payload = try await WidgetAPIClient.fetchSunPayload(),
        let snapshot = WidgetClockParser.sunSnapshot(from: payload, now: now)
      else {
        return PreviewFixtures.sunDaylightEntry(date: now, fetchErrorDescription: "Sun data unavailable.")
      }

      return SunDaylightEntry(date: now, payload: payload, snapshot: snapshot, fetchErrorDescription: nil)
    } catch {
      return PreviewFixtures.sunDaylightEntry(
        date: now,
        fetchErrorDescription: error.localizedDescription
      )
    }
  }
}

extension SunDaylightEntry {
  static func placeholder(date: Date = .now) -> SunDaylightEntry {
    PreviewFixtures.sunDaylightEntry(date: date)
  }
}

struct SunDaylightWidget: Widget {
  private let kind = "SunDaylightWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: SunDaylightProvider()) { entry in
      SunDaylightWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Sun & Daylight")
    .description("Track daylight remaining, sunrise, and sunset across iPhone surfaces.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryInline, .accessoryCircular, .accessoryRectangular])
  }
}

private struct SunDaylightWidgetEntryView: View {
  @Environment(\.widgetFamily) private var family

  let entry: SunDaylightEntry

  var body: some View {
    switch family {
    case .systemSmall:
      HomeSunWidgetView(entry: entry, compact: true)
        .widgetURL(entry.deepLink)
    case .systemMedium:
      HomeSunWidgetView(entry: entry, compact: false)
        .widgetURL(entry.deepLink)
    case .accessoryInline:
      InlineSunAccessoryView(entry: entry)
        .widgetURL(entry.deepLink)
    case .accessoryCircular:
      CircularSunAccessoryView(entry: entry)
        .widgetURL(entry.deepLink)
    case .accessoryRectangular:
      RectangularSunAccessoryView(entry: entry)
        .widgetURL(entry.deepLink)
    default:
      HomeSunWidgetView(entry: entry, compact: false)
        .widgetURL(entry.deepLink)
    }
  }
}

private struct HomeSunWidgetView: View {
  let entry: SunDaylightEntry
  let compact: Bool

  private var palette: WidgetPalette {
    entry.isDaylight ? .sunDaylight : .sunNight
  }

  var body: some View {
    Group {
      if compact {
        SunCompactHomeContent(entry: entry, palette: palette)
      } else {
        SunMediumHomeContent(entry: entry, palette: palette)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding(compact ? EdgeInsets(top: 15, leading: 14, bottom: 13, trailing: 14) : EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16))
    .siouxlandWidgetBackground(palette)
  }
}

private struct SunCompactHomeContent: View {
  let entry: SunDaylightEntry
  let palette: WidgetPalette

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(alignment: .center, spacing: 8) {
        HStack(spacing: 5) {
          Image(systemName: entry.snapshot.phase.symbolName)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(palette.accent)

          Text("SUN")
            .font(.system(size: 10, weight: .black, design: .rounded))
            .tracking(1.1)
            .foregroundStyle(palette.tertiaryText)
        }

        Spacer(minLength: 8)

        Text(entry.isDaylight ? "LIVE" : "NEXT")
          .font(.system(size: 10, weight: .black, design: .rounded))
          .foregroundStyle(palette.accent)
          .padding(.horizontal, 7)
          .padding(.vertical, 3)
          .background(palette.chipFill, in: Capsule())
      }

      VStack(alignment: .leading, spacing: 4) {
        Text(entry.isDaylight ? "Daylight left" : "Sunrise in")
          .font(.caption)
          .foregroundStyle(palette.secondaryText)

        Text(entry.snapshot.targetDate, style: .timer)
          .font(.system(size: 26, weight: .heavy, design: .rounded))
          .monospacedDigit()
          .foregroundStyle(palette.accent)
          .minimumScaleFactor(0.78)
      }

      SunArcGauge(progress: entry.snapshot.progress, palette: palette, lineWidth: 6)
        .frame(height: 52)
        .padding(.horizontal, 2)
        .padding(.top, 2)

      HStack(spacing: 12) {
        SunCaptionMetric(label: "Rise", value: WidgetClockParser.compactTime(entry.snapshot.sunrise), palette: palette)
        Spacer(minLength: 8)
        SunCaptionMetric(label: "Set", value: WidgetClockParser.compactTime(entry.snapshot.sunset), palette: palette, alignTrailing: true)
      }
    }
  }
}

private struct SunMediumHomeContent: View {
  let entry: SunDaylightEntry
  let palette: WidgetPalette

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SunWidgetHeader(entry: entry, palette: palette, compact: false)

      HStack(alignment: .center, spacing: 14) {
        VStack(alignment: .leading, spacing: 9) {
          Text(entry.isDaylight ? "Daylight left" : "Sunrise in")
            .font(.caption)
            .foregroundStyle(palette.secondaryText)

          Text(entry.snapshot.targetDate, style: .timer)
            .font(.system(size: 35, weight: .heavy, design: .rounded))
            .monospacedDigit()
            .foregroundStyle(palette.accent)
            .minimumScaleFactor(0.72)

          Text("\(entry.snapshot.dayLength) of daylight today")
            .font(.caption)
            .foregroundStyle(palette.secondaryText)
            .lineLimit(1)

          HStack(spacing: 14) {
            SunCaptionMetric(label: "Sunrise", value: WidgetClockParser.shortTime(entry.snapshot.sunrise), palette: palette)
            SunCaptionMetric(label: "Sunset", value: WidgetClockParser.shortTime(entry.snapshot.sunset), palette: palette)
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        SunArcGauge(progress: entry.snapshot.progress, palette: palette, lineWidth: 7)
          .frame(width: 116, height: 88)
      }
    }
  }
}

private struct SunWidgetHeader: View {
  let entry: SunDaylightEntry
  let palette: WidgetPalette
  let compact: Bool

  var body: some View {
    HStack(alignment: .center, spacing: 8) {
      HStack(spacing: 6) {
        Image(systemName: entry.snapshot.phase.symbolName)
          .font(.system(size: compact ? 12 : 13, weight: .semibold))
          .foregroundStyle(palette.accent)

        Text("Sun & Daylight")
          .font(compact ? .caption.weight(.semibold) : .subheadline.weight(.semibold))
          .foregroundStyle(palette.primaryText)
          .lineLimit(1)
      }

      Spacer(minLength: 8)

      Text(entry.isDaylight ? "LIVE" : "NEXT")
        .font(.caption2.weight(.black))
        .foregroundStyle(palette.accent)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(palette.chipFill, in: Capsule())
    }
  }
}

private struct SunCaptionMetric: View {
  let label: String
  let value: String
  let palette: WidgetPalette
  var alignTrailing: Bool = false

  var body: some View {
    VStack(alignment: alignTrailing ? .trailing : .leading, spacing: 2) {
      Text(label)
        .font(.system(size: 10, weight: .medium))
        .foregroundStyle(palette.tertiaryText)
      Text(value)
        .font(.system(size: 13, weight: .semibold, design: .rounded))
        .foregroundStyle(palette.primaryText)
        .monospacedDigit()
    }
  }
}

private struct InlineSunAccessoryView: View {
  let entry: SunDaylightEntry

  var body: some View {
    HStack(spacing: 4) {
      Image(systemName: entry.snapshot.phase.symbolName)
      Text(entry.snapshot.targetDate, style: .timer)
        .monospacedDigit()
    }
  }
}

private struct CircularSunAccessoryView: View {
  let entry: SunDaylightEntry

  private var palette: WidgetPalette {
    entry.isDaylight ? .sunDaylight : .sunNight
  }

  var body: some View {
    ZStack {
      Circle()
        .stroke(palette.track, lineWidth: 6)

      Circle()
        .trim(from: 0, to: max(entry.snapshot.progress, 0.02))
        .stroke(
          palette.accent,
          style: StrokeStyle(lineWidth: 6, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))

      Image(systemName: entry.snapshot.phase.symbolName)
        .font(.system(size: 12, weight: .bold))
    }
    .padding(6)
  }
}

private struct RectangularSunAccessoryView: View {
  let entry: SunDaylightEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Label(entry.isDaylight ? "Daylight left" : "Sunrise in", systemImage: entry.snapshot.phase.symbolName)
        .font(.caption2.weight(.semibold))
      Text(entry.snapshot.targetDate, style: .timer)
        .font(.headline.monospacedDigit())
      Text("\(WidgetClockParser.shortTime(entry.snapshot.sunrise)) sunrise • \(WidgetClockParser.shortTime(entry.snapshot.sunset)) sunset")
        .font(.caption2)
        .foregroundStyle(.secondary)
    }
  }
}

private struct SunArcGauge: View {
  let progress: Double
  let palette: WidgetPalette
  let lineWidth: CGFloat

  var body: some View {
    GeometryReader { geometry in
      let clampedProgress = min(max(progress, 0), 1)
      let radius = min(geometry.size.width / 2, geometry.size.height - lineWidth)
      let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height - lineWidth)
      let angle = Double.pi * (1 - clampedProgress)
      let sunPosition = CGPoint(
        x: center.x + CGFloat(cos(angle)) * radius,
        y: center.y - CGFloat(sin(angle)) * radius
      )

      ZStack {
        SemiCircleArc()
          .stroke(palette.track, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))

        SemiCircleArc()
          .trim(from: 0, to: max(clampedProgress, 0.03))
          .stroke(
            LinearGradient(
              colors: [palette.accentSecondary, palette.accent],
              startPoint: .leading,
              endPoint: .trailing
            ),
            style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
          )

        Circle()
          .fill(palette.accent.opacity(0.22))
          .frame(width: lineWidth * 4.4, height: lineWidth * 4.4)
          .position(x: sunPosition.x, y: sunPosition.y)

        Circle()
          .fill(palette.accent)
          .frame(width: lineWidth * 2.8, height: lineWidth * 2.8)
          .overlay(
            Circle()
              .stroke(.white.opacity(0.7), lineWidth: 1.5)
          )
          .position(x: sunPosition.x, y: sunPosition.y)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

private struct SemiCircleArc: Shape {
  func path(in rect: CGRect) -> Path {
    let radius = min(rect.width / 2, rect.height)
    let center = CGPoint(x: rect.midX, y: rect.maxY)
    var path = Path()
    path.addArc(
      center: center,
      radius: radius,
      startAngle: .degrees(180),
      endAngle: .degrees(0),
      clockwise: false
    )
    return path
  }
}

#if DEBUG
@available(iOS 17.0, *)
#Preview("Sun Small", as: .systemSmall) {
  SunDaylightWidget()
} timeline: {
  PreviewFixtures.sunDaylightEntry()
}

@available(iOS 17.0, *)
#Preview("Sun Medium", as: .systemMedium) {
  SunDaylightWidget()
} timeline: {
  PreviewFixtures.sunDaylightEntry()
}

@available(iOS 17.0, *)
#Preview("Sun Night Inline", as: .accessoryInline) {
  SunDaylightWidget()
} timeline: {
  PreviewFixtures.sunNightEntry()
}
#endif
