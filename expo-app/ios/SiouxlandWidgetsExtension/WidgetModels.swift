import Foundation
import SwiftUI
import WidgetKit

struct SunWidgetPayload: Decodable, Hashable {
  let sunrise: String
  let sunset: String
  let dawn: String
  let dusk: String
  let goldenHour: String
  let dayLength: String
  let solarNoon: String
  let firstLight: String
  let lastLight: String
}

struct SunAPIEnvelope: Decodable {
  let data: SunWidgetPayload?
  let timestamp: String?
  let source: String?
  let error: String?
}

struct DigestWidgetPayload: Decodable, Hashable {
  let id: String
  let edition: String
  let date: String
  let summary: String
  let content: String?
  let createdAt: String

  var editionLabel: String {
    switch edition {
    case "morning":
      return "Morning Edition"
    case "midday":
      return "Midday Edition"
    case "evening":
      return "Evening Edition"
    default:
      return "Siouxland Digest"
    }
  }

  var shortEditionLabel: String {
    switch edition {
    case "morning":
      return "AM"
    case "midday":
      return "Midday"
    case "evening":
      return "PM"
    default:
      return "Digest"
    }
  }

  var symbolName: String {
    switch edition {
    case "morning":
      return "sun.max.fill"
    case "midday":
      return "sun.horizon.fill"
    case "evening":
      return "moon.fill"
    default:
      return "newspaper.fill"
    }
  }

  var deepLink: URL? {
    URL(string: "siouxland://digest/\(id)")
  }

  var createdDate: Date? {
    WidgetClockParser.parseISODate(createdAt)
  }

  var plainSummary: String {
    summary
      .replacingOccurrences(of: "**", with: "")
      .replacingOccurrences(of: "__", with: "")
      .replacingOccurrences(of: "###", with: "")
      .replacingOccurrences(of: "##", with: "")
      .trimmingCharacters(in: .whitespacesAndNewlines)
  }
}

struct DigestResponseEnvelope: Decodable {
  let digest: DigestWidgetPayload?
  let available: Bool?
}

enum SunWidgetPhase: String, Hashable {
  case daylight
  case night

  var symbolName: String {
    switch self {
    case .daylight:
      return "sun.max.fill"
    case .night:
      return "moon.stars.fill"
    }
  }

  var title: String {
    switch self {
    case .daylight:
      return "Daylight remaining"
    case .night:
      return "Until sunrise"
    }
  }

  var accentColorName: String {
    switch self {
    case .daylight:
      return "DaylightAccent"
    case .night:
      return "NightAccent"
    }
  }
}

struct SunComputedSnapshot: Hashable {
  let sunrise: Date
  let sunset: Date
  let lastLight: Date
  let targetDate: Date
  let phase: SunWidgetPhase
  let progress: Double
  let nextRefresh: Date
  let dayLength: String
}

enum WidgetClockParser {
  private static let clockFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "h:mm:ss a"
    return formatter
  }()

  private static let fallbackClockFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "h:mm a"
    return formatter
  }()

  static let shortTimeFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeStyle = .short
    return formatter
  }()

  static let compactTimeFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "h:mm"
    return formatter
  }()

  private static let isoDateFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
  }()

  private static let fallbackISODateFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter
  }()

  static func date(from clock: String, on baseDate: Date, calendar: Calendar = .current) -> Date? {
    guard let parsedTime = clockFormatter.date(from: clock) ?? fallbackClockFormatter.date(from: clock) else {
      return nil
    }

    let baseComponents = calendar.dateComponents([.year, .month, .day], from: baseDate)
    let timeComponents = calendar.dateComponents([.hour, .minute, .second], from: parsedTime)

    return calendar.date(from: DateComponents(
      timeZone: calendar.timeZone,
      year: baseComponents.year,
      month: baseComponents.month,
      day: baseComponents.day,
      hour: timeComponents.hour,
      minute: timeComponents.minute,
      second: timeComponents.second
    ))
  }

  static func shortTime(_ date: Date) -> String {
    shortTimeFormatter.string(from: date)
  }

  static func compactTime(_ date: Date) -> String {
    compactTimeFormatter.string(from: date)
  }

  static func parseISODate(_ value: String) -> Date? {
    if let date = isoDateFormatter.date(from: value) {
      return date
    }

    return fallbackISODateFormatter.date(from: value)
  }

  static func nextDigestRefresh(after now: Date, calendar: Calendar = .current) -> Date {
    let components = calendar.dateComponents([.hour, .minute], from: now)
    let hour = components.hour ?? 0
    let minute = components.minute ?? 0

    if hour >= 5 && hour < 22 {
      let minutesToNextQuarter = 15 - (minute % 15)
      return calendar.date(byAdding: .minute, value: minutesToNextQuarter == 0 ? 15 : minutesToNextQuarter, to: now) ?? now.addingTimeInterval(15 * 60)
    }

    return calendar.date(byAdding: .hour, value: 1, to: now) ?? now.addingTimeInterval(60 * 60)
  }

  static func sunSnapshot(from payload: SunWidgetPayload, now: Date = .now, calendar: Calendar = .current) -> SunComputedSnapshot? {
    guard
      let sunrise = date(from: payload.sunrise, on: now, calendar: calendar),
      let sunset = date(from: payload.sunset, on: now, calendar: calendar),
      let lastLight = date(from: payload.lastLight, on: now, calendar: calendar)
    else {
      return nil
    }

    let nextSunrise = sunrise > now ? sunrise : calendar.date(byAdding: .day, value: 1, to: sunrise) ?? sunrise.addingTimeInterval(24 * 60 * 60)
    let phase: SunWidgetPhase = (now >= sunrise && now < sunset) ? .daylight : .night
    let targetDate = phase == .daylight ? sunset : nextSunrise

    let rawProgress = (now.timeIntervalSince(sunrise) / max(sunset.timeIntervalSince(sunrise), 1))
    let progress = min(max(rawProgress, 0), 1)

    let boundaryRefresh: Date
    if now < sunrise {
      boundaryRefresh = sunrise
    } else if now < sunset {
      boundaryRefresh = sunset
    } else {
      boundaryRefresh = nextSunrise
    }

    let frequentRefresh: Date
    if phase == .daylight {
      frequentRefresh = now.addingTimeInterval(15 * 60)
    } else {
      frequentRefresh = now.addingTimeInterval(60 * 60)
    }

    return SunComputedSnapshot(
      sunrise: sunrise,
      sunset: sunset,
      lastLight: lastLight,
      targetDate: targetDate,
      phase: phase,
      progress: progress,
      nextRefresh: min(boundaryRefresh, frequentRefresh),
      dayLength: payload.dayLength
    )
  }
}

enum WidgetPalette {
  case sunDaylight
  case sunNight
  case digestMorning
  case digestMidday
  case digestEvening
  case digestFallback

  static func digest(for edition: String?) -> WidgetPalette {
    switch edition {
    case "morning":
      return .digestMorning
    case "midday":
      return .digestMidday
    case "evening":
      return .digestEvening
    default:
      return .digestFallback
    }
  }

  var backgroundTop: Color {
    switch self {
    case .sunDaylight:
      return Color(red: 0.23, green: 0.13, blue: 0.08)
    case .sunNight:
      return Color(red: 0.18, green: 0.10, blue: 0.11)
    case .digestMorning:
      return Color(red: 0.20, green: 0.12, blue: 0.08)
    case .digestMidday:
      return Color(red: 0.20, green: 0.11, blue: 0.07)
    case .digestEvening:
      return Color(red: 0.18, green: 0.09, blue: 0.09)
    case .digestFallback:
      return Color(red: 0.19, green: 0.11, blue: 0.08)
    }
  }

  var backgroundBottom: Color {
    switch self {
    case .sunDaylight:
      return Color(red: 0.11, green: 0.06, blue: 0.04)
    case .sunNight:
      return Color(red: 0.08, green: 0.05, blue: 0.08)
    case .digestMorning:
      return Color(red: 0.09, green: 0.06, blue: 0.05)
    case .digestMidday:
      return Color(red: 0.09, green: 0.05, blue: 0.04)
    case .digestEvening:
      return Color(red: 0.08, green: 0.05, blue: 0.06)
    case .digestFallback:
      return Color(red: 0.09, green: 0.06, blue: 0.05)
    }
  }

  var glow: Color {
    switch self {
    case .sunDaylight:
      return Color(red: 1, green: 0.73, blue: 0.29)
    case .sunNight:
      return Color(red: 0.78, green: 0.70, blue: 1)
    case .digestMorning:
      return Color(red: 1, green: 0.73, blue: 0.29)
    case .digestMidday:
      return Color(red: 1, green: 0.58, blue: 0.23)
    case .digestEvening:
      return Color(red: 0.98, green: 0.57, blue: 0.42)
    case .digestFallback:
      return Color(red: 1, green: 0.70, blue: 0.28)
    }
  }

  var accent: Color {
    switch self {
    case .sunDaylight:
      return Color(red: 1, green: 0.79, blue: 0.27)
    case .sunNight:
      return Color(red: 0.79, green: 0.73, blue: 1)
    case .digestMorning:
      return Color(red: 1, green: 0.79, blue: 0.27)
    case .digestMidday:
      return Color(red: 1, green: 0.60, blue: 0.25)
    case .digestEvening:
      return Color(red: 0.98, green: 0.59, blue: 0.42)
    case .digestFallback:
      return Color(red: 1, green: 0.74, blue: 0.28)
    }
  }

  var accentSecondary: Color {
    switch self {
    case .sunDaylight:
      return Color(red: 1, green: 0.56, blue: 0.18)
    case .sunNight:
      return Color(red: 0.53, green: 0.43, blue: 0.86)
    case .digestMorning:
      return Color(red: 1, green: 0.54, blue: 0.20)
    case .digestMidday:
      return Color(red: 0.98, green: 0.41, blue: 0.20)
    case .digestEvening:
      return Color(red: 0.82, green: 0.32, blue: 0.33)
    case .digestFallback:
      return Color(red: 0.96, green: 0.46, blue: 0.20)
    }
  }

  var primaryText: Color {
    Color(red: 0.96, green: 0.93, blue: 0.89)
  }

  var secondaryText: Color {
    primaryText.opacity(0.76)
  }

  var tertiaryText: Color {
    primaryText.opacity(0.58)
  }

  var chipFill: Color {
    .white.opacity(0.08)
  }

  var divider: Color {
    .white.opacity(0.09)
  }

  var track: Color {
    .white.opacity(0.15)
  }
}

private struct WidgetBackgroundView: View {
  let palette: WidgetPalette

  var body: some View {
    ZStack {
      LinearGradient(
        colors: [palette.backgroundTop, palette.backgroundBottom],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )

      RadialGradient(
        colors: [palette.glow.opacity(0.20), .clear],
        center: .topLeading,
        startRadius: 10,
        endRadius: 240
      )
      .blendMode(.screen)

      LinearGradient(
        colors: [.white.opacity(0.05), .clear, .black.opacity(0.10)],
        startPoint: .top,
        endPoint: .bottom
      )
    }
  }
}

extension View {
  @ViewBuilder
  func siouxlandWidgetBackground(_ palette: WidgetPalette) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      containerBackground(for: .widget) {
        WidgetBackgroundView(palette: palette)
      }
    } else {
      background(WidgetBackgroundView(palette: palette))
    }
  }
}
