import ActivityKit
import Foundation

public struct SunDaylightActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public enum Phase: String, Codable, Hashable {
      case daylight
      case night
    }

    public var phase: Phase
    public var targetDate: Date
    public var sunrise: Date
    public var sunset: Date
    public var lastLight: Date
    public var dayLength: String?
    public var deepLink: String

    public init(
      phase: Phase,
      targetDate: Date,
      sunrise: Date,
      sunset: Date,
      lastLight: Date,
      dayLength: String?,
      deepLink: String
    ) {
      self.phase = phase
      self.targetDate = targetDate
      self.sunrise = sunrise
      self.sunset = sunset
      self.lastLight = lastLight
      self.dayLength = dayLength
      self.deepLink = deepLink
    }
  }

  public var title: String

  public init(title: String) {
    self.title = title
  }
}
