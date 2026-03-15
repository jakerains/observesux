import Foundation

enum PreviewFixtures {
  static let previewNow = Date(timeIntervalSince1970: 1_773_499_200)

  static let sampleSun = SunWidgetPayload(
    sunrise: "7:40:46 AM",
    sunset: "7:31:00 PM",
    dawn: "7:09:00 AM",
    dusk: "8:03:00 PM",
    goldenHour: "6:45:00 PM",
    dayLength: "11:50:48",
    solarNoon: "1:36:10 PM",
    firstLight: "6:38:00 AM",
    lastLight: "8:34:00 PM"
  )

  static let sampleDigest = DigestWidgetPayload(
    id: "preview-digest",
    edition: "morning",
    date: "2026-03-14",
    summary: "Clouds stick around for part of the day, local headlines stay busy, and a fresh round of community events is worth a look.",
    content: nil,
    createdAt: "2026-03-14T12:00:00.000Z"
  )

  static func sunDaylightEntry(date: Date = previewNow, fetchErrorDescription: String? = nil) -> SunDaylightEntry {
    let snapshot = WidgetClockParser.sunSnapshot(from: sampleSun, now: date) ?? fallbackSnapshot(date: date)
    return SunDaylightEntry(date: date, payload: sampleSun, snapshot: snapshot, fetchErrorDescription: fetchErrorDescription)
  }

  static func sunNightEntry(date: Date = previewNow.addingTimeInterval(9 * 60 * 60)) -> SunDaylightEntry {
    let snapshot = WidgetClockParser.sunSnapshot(from: sampleSun, now: date) ?? fallbackSnapshot(date: date)
    return SunDaylightEntry(date: date, payload: sampleSun, snapshot: snapshot, fetchErrorDescription: nil)
  }

  static func digestSummaryEntry(date: Date = previewNow) -> DigestSummaryEntry {
    DigestSummaryEntry(
      date: date,
      digest: sampleDigest,
      nextRefresh: WidgetClockParser.nextDigestRefresh(after: date),
      fetchErrorDescription: nil
    )
  }

  static let activityAttributes = SunDaylightActivityAttributes(title: "Sun & Daylight")
  static let daylightActivityState = SunDaylightActivityAttributes.ContentState(
    phase: .daylight,
    targetDate: previewNow.addingTimeInterval(3 * 60 * 60 + 39 * 60),
    sunrise: WidgetClockParser.date(from: sampleSun.sunrise, on: previewNow) ?? previewNow,
    sunset: WidgetClockParser.date(from: sampleSun.sunset, on: previewNow) ?? previewNow.addingTimeInterval(8 * 60 * 60),
    lastLight: WidgetClockParser.date(from: sampleSun.lastLight, on: previewNow) ?? previewNow.addingTimeInterval(9 * 60 * 60),
    dayLength: sampleSun.dayLength,
    deepLink: "siouxland://sun"
  )
  static let nightActivityState = SunDaylightActivityAttributes.ContentState(
    phase: .night,
    targetDate: previewNow.addingTimeInterval(8 * 60 * 60),
    sunrise: WidgetClockParser.date(from: sampleSun.sunrise, on: previewNow) ?? previewNow,
    sunset: WidgetClockParser.date(from: sampleSun.sunset, on: previewNow) ?? previewNow.addingTimeInterval(8 * 60 * 60),
    lastLight: WidgetClockParser.date(from: sampleSun.lastLight, on: previewNow) ?? previewNow.addingTimeInterval(9 * 60 * 60),
    dayLength: sampleSun.dayLength,
    deepLink: "siouxland://sun"
  )

  private static func fallbackSnapshot(date: Date) -> SunComputedSnapshot {
    let sunrise = date.addingTimeInterval(-4 * 60 * 60)
    let sunset = date.addingTimeInterval(4 * 60 * 60)
    return SunComputedSnapshot(
      sunrise: sunrise,
      sunset: sunset,
      lastLight: sunset.addingTimeInterval(30 * 60),
      targetDate: sunset,
      phase: .daylight,
      progress: 0.5,
      nextRefresh: date.addingTimeInterval(15 * 60),
      dayLength: sampleSun.dayLength
    )
  }
}
