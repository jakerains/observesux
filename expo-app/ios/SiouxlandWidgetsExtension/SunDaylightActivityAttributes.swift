import ActivityKit
import Foundation

struct SunDaylightActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    enum Phase: String, Codable, Hashable {
      case daylight
      case night
    }

    var phase: Phase
    var targetDate: Date
    var sunrise: Date
    var sunset: Date
    var lastLight: Date
    var dayLength: String?
    var deepLink: String
  }

  var title: String
}
