import ActivityKit
import SwiftUI
import WidgetKit

struct SunDaylightActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SunDaylightActivityAttributes.self) { context in
      LiveActivityExpandedView(context: context)
        .activityBackgroundTint(Color(red: 0.12, green: 0.08, blue: 0.05))
        .activitySystemActionForegroundColor(.white)
        .widgetURL(URL(string: context.state.deepLink))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label(
            context.state.phase == .daylight ? "Daylight" : "Sunrise",
            systemImage: context.state.phase == .daylight ? "sun.max.fill" : "moon.stars.fill"
          )
          .font(.caption.weight(.semibold))
        }

        DynamicIslandExpandedRegion(.trailing) {
          Text(context.state.targetDate, style: .timer)
            .font(.headline.monospacedDigit())
        }

        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 6) {
            Text(context.state.phase == .daylight ? "Sunset countdown is live." : "Tracking the next sunrise.")
              .font(.subheadline.weight(.semibold))
            Text("\(WidgetClockParser.shortTime(context.state.sunrise)) sunrise • \(WidgetClockParser.shortTime(context.state.sunset)) sunset")
              .font(.caption)
              .foregroundStyle(.secondary)
          }
        }
      } compactLeading: {
        Image(systemName: context.state.phase == .daylight ? "sun.max.fill" : "moon.stars.fill")
      } compactTrailing: {
        Text(context.state.targetDate, style: .timer)
          .font(.caption2.monospacedDigit())
      } minimal: {
        Image(systemName: context.state.phase == .daylight ? "sun.max.fill" : "moon.stars.fill")
      }
      .widgetURL(URL(string: context.state.deepLink))
    }
  }
}

private struct LiveActivityExpandedView: View {
  let context: ActivityViewContext<SunDaylightActivityAttributes>

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .center) {
        Label(context.attributes.title, systemImage: context.state.phase == .daylight ? "sun.max.fill" : "moon.stars.fill")
          .font(.caption.weight(.semibold))
        Spacer(minLength: 12)
        Text(context.state.phase == .daylight ? "LIVE" : "NEXT")
          .font(.caption2.weight(.bold))
          .padding(.horizontal, 8)
          .padding(.vertical, 4)
          .background(.white.opacity(0.12), in: Capsule())
      }

      Text(context.state.targetDate, style: .timer)
        .font(.system(.title, design: .rounded).weight(.bold))
        .monospacedDigit()

      Text(context.state.phase == .daylight ? "Daylight remaining until sunset." : "Overnight countdown to sunrise.")
        .font(.caption)
        .foregroundStyle(.white.opacity(0.78))

      HStack {
        VStack(alignment: .leading, spacing: 2) {
          Text("Sunrise")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.6))
          Text(WidgetClockParser.shortTime(context.state.sunrise))
            .font(.caption.weight(.medium))
        }
        Spacer()
        VStack(alignment: .trailing, spacing: 2) {
          Text("Sunset")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.6))
          Text(WidgetClockParser.shortTime(context.state.sunset))
            .font(.caption.weight(.medium))
        }
      }
    }
    .foregroundStyle(.white)
    .padding(16)
  }
}

#if DEBUG
@available(iOS 17.0, *)
#Preview("Live Activity", as: .content, using: PreviewFixtures.activityAttributes) {
  SunDaylightActivityWidget()
} contentStates: {
  PreviewFixtures.daylightActivityState
  PreviewFixtures.nightActivityState
}
#endif
