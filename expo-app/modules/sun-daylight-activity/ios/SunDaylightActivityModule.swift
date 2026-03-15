import ActivityKit
import ExpoModulesCore

public final class SunDaylightActivityModule: Module {
  private static let internetDateFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter
  }()

  private static let fractionalInternetDateFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
  }()

  public func definition() -> ModuleDefinition {
    Name("SunDaylightActivity")

    AsyncFunction("startSunLiveActivity") { (input: [String: Any]) async throws -> [String: Any?] in
      guard #available(iOS 16.1, *) else {
        return Self.unsupportedState()
      }

      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        return Self.currentState()
      }

      let sunrise = try Self.requireDate(for: "sunrise", in: input)
      let sunset = try Self.requireDate(for: "sunset", in: input)
      let lastLight = try Self.requireDate(for: "lastLight", in: input)
      let dayLength = input["dayLength"] as? String
      let deepLink = (input["deepLink"] as? String) ?? "siouxland://sun"
      let now = Date()
      let phase: SunDaylightActivityAttributes.ContentState.Phase = now < sunset && now >= sunrise ? .daylight : .night
      let targetDate = phase == .daylight ? sunset : Self.nextSunrise(from: sunrise, now: now)

      for activity in Activity<SunDaylightActivityAttributes>.activities {
        await activity.end(using: nil, dismissalPolicy: .immediate)
      }

      let attributes = SunDaylightActivityAttributes(title: "Sun & Daylight")
      let state = SunDaylightActivityAttributes.ContentState(
        phase: phase,
        targetDate: targetDate,
        sunrise: sunrise,
        sunset: sunset,
        lastLight: lastLight,
        dayLength: dayLength,
        deepLink: deepLink
      )

      _ = try Activity.request(attributes: attributes, contentState: state, pushType: nil)

      return Self.currentState()
    }

    AsyncFunction("endSunLiveActivity") { () async -> [String: Any?] in
      guard #available(iOS 16.1, *) else {
        return Self.unsupportedState()
      }

      for activity in Activity<SunDaylightActivityAttributes>.activities {
        await activity.end(using: nil, dismissalPolicy: .immediate)
      }

      return Self.currentState()
    }

    AsyncFunction("getSunLiveActivityState") { () async -> [String: Any?] in
      Self.currentState()
    }
  }

  private static func requireDate(for key: String, in payload: [String: Any]) throws -> Date {
    guard let value = payload[key] as? String, let date = parseISODate(value) else {
      throw NSError(
        domain: "SunDaylightActivity",
        code: 0,
        userInfo: [NSLocalizedDescriptionKey: "Missing or invalid ISO-8601 date for '\(key)'."]
      )
    }

    return date
  }

  private static func nextSunrise(from sunrise: Date, now: Date) -> Date {
    if sunrise > now {
      return sunrise
    }

    return sunrise.addingTimeInterval(24 * 60 * 60)
  }

  private static func parseISODate(_ value: String) -> Date? {
    if let date = fractionalInternetDateFormatter.date(from: value) {
      return date
    }

    return internetDateFormatter.date(from: value)
  }

  private static func unsupportedState() -> [String: Any?] {
    [
      "isSupported": false,
      "areActivitiesEnabled": false,
      "activeActivityId": nil,
      "phase": nil,
      "targetDate": nil,
      "staleDate": nil,
    ]
  }

  private static func currentState() -> [String: Any?] {
    guard #available(iOS 16.1, *) else {
      return unsupportedState()
    }

    let authorization = ActivityAuthorizationInfo()
    let activity = Activity<SunDaylightActivityAttributes>.activities.first

    return [
      "isSupported": true,
      "areActivitiesEnabled": authorization.areActivitiesEnabled,
      "activeActivityId": activity?.id,
      "phase": activity?.contentState.phase.rawValue,
      "targetDate": activity?.contentState.targetDate.ISO8601Format(),
      "staleDate": activity?.contentState.targetDate.ISO8601Format(),
    ]
  }
}
