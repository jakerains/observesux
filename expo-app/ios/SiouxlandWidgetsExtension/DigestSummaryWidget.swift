import SwiftUI
import WidgetKit

struct DigestSummaryEntry: TimelineEntry {
  let date: Date
  let digest: DigestWidgetPayload?
  let nextRefresh: Date
  let fetchErrorDescription: String?

  static func placeholder(date: Date = .now) -> DigestSummaryEntry {
    PreviewFixtures.digestSummaryEntry(date: date)
  }
}

struct DigestSummaryProvider: TimelineProvider {
  func placeholder(in context: Context) -> DigestSummaryEntry {
    .placeholder()
  }

  func getSnapshot(in context: Context, completion: @escaping (DigestSummaryEntry) -> Void) {
    Task {
      completion(await loadEntry())
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DigestSummaryEntry>) -> Void) {
    Task {
      let entry = await loadEntry()
      completion(Timeline(entries: [entry], policy: .after(entry.nextRefresh)))
    }
  }

  private func loadEntry(now: Date = .now) async -> DigestSummaryEntry {
    do {
      let digest = try await WidgetAPIClient.fetchDigestPayload()
      return DigestSummaryEntry(
        date: now,
        digest: digest,
        nextRefresh: WidgetClockParser.nextDigestRefresh(after: now),
        fetchErrorDescription: nil
      )
    } catch {
      return DigestSummaryEntry(
        date: now,
        digest: PreviewFixtures.sampleDigest,
        nextRefresh: WidgetClockParser.nextDigestRefresh(after: now),
        fetchErrorDescription: error.localizedDescription
      )
    }
  }
}

struct DigestSummaryWidget: Widget {
  private let kind = "DigestSummaryWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: DigestSummaryProvider()) { entry in
      DigestSummaryWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Siouxland Digest")
    .description("Keep the latest Siouxland Digest summary on the Home Screen and Lock Screen.")
    .supportedFamilies([.systemMedium, .systemLarge, .accessoryInline, .accessoryRectangular])
  }
}

private struct DigestSummaryWidgetEntryView: View {
  @Environment(\.widgetFamily) private var family

  let entry: DigestSummaryEntry

  var body: some View {
    switch family {
    case .systemMedium:
      DigestHomeWidgetView(entry: entry, large: false)
        .widgetURL(entry.digest?.deepLink)
    case .systemLarge:
      DigestHomeWidgetView(entry: entry, large: true)
        .widgetURL(entry.digest?.deepLink)
    case .accessoryInline:
      DigestInlineAccessoryView(entry: entry)
        .widgetURL(entry.digest?.deepLink)
    case .accessoryRectangular:
      DigestRectangularAccessoryView(entry: entry)
        .widgetURL(entry.digest?.deepLink)
    default:
      DigestHomeWidgetView(entry: entry, large: false)
        .widgetURL(entry.digest?.deepLink)
    }
  }
}

private struct DigestHomeWidgetView: View {
  let entry: DigestSummaryEntry
  let large: Bool

  private var palette: WidgetPalette {
    WidgetPalette.digest(for: entry.digest?.edition)
  }

  private var footerCopy: String {
    if entry.fetchErrorDescription == nil {
      return large ? "Tap to open the full digest in Siouxland Online." : "Open full digest in app"
    }

    return large ? "Showing the latest cached digest while we reconnect." : "Showing cached digest"
  }

  var body: some View {
    VStack(alignment: .leading, spacing: large ? 14 : 12) {
      if let digest = entry.digest {
        DigestHeader(digest: digest, palette: palette, large: large)

        Text(digest.plainSummary.isEmpty ? "Open Siouxland Online for the latest community digest." : digest.plainSummary)
          .font(.system(size: large ? 17 : 15, weight: .medium, design: .rounded))
          .foregroundStyle(palette.primaryText)
          .lineSpacing(3)
          .lineLimit(large ? 8 : 4)
          .multilineTextAlignment(.leading)
          .frame(maxWidth: .infinity, alignment: .leading)

        Spacer(minLength: 0)

        HStack(alignment: .center) {
          Text(footerCopy)
            .font(large ? .caption : .caption2)
            .foregroundStyle(palette.secondaryText)
            .lineLimit(large ? 2 : 1)

          Spacer(minLength: 8)

          Image(systemName: "arrow.up.right")
            .font(.caption.weight(.bold))
            .foregroundStyle(palette.accent)
        }
      } else {
        VStack(alignment: .leading, spacing: 12) {
          HStack(spacing: 10) {
            DigestGlyph(symbolName: "newspaper.fill", palette: palette, large: large)
            VStack(alignment: .leading, spacing: 2) {
              Text("SIOUXLAND DIGEST")
                .font(.caption2.weight(.black))
                .tracking(0.8)
                .foregroundStyle(palette.tertiaryText)
              Text("Digest pending")
                .font(large ? .headline.weight(.semibold) : .subheadline.weight(.semibold))
                .foregroundStyle(palette.primaryText)
            }
          }

          Text("No digest is available right now.")
            .font(.headline)
            .foregroundStyle(palette.primaryText)

          Text("The widget will keep checking on a native timeline without opening the app.")
            .font(.caption)
            .foregroundStyle(palette.secondaryText)
        }
        Spacer(minLength: 0)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding(16)
    .siouxlandWidgetBackground(palette)
  }
}

private struct DigestHeader: View {
  let digest: DigestWidgetPayload
  let palette: WidgetPalette
  let large: Bool

  var body: some View {
    HStack(alignment: .top, spacing: 10) {
      DigestGlyph(symbolName: digest.symbolName, palette: palette, large: large)

      VStack(alignment: .leading, spacing: 3) {
        Text("SIOUXLAND DIGEST")
          .font(.caption2.weight(.black))
          .tracking(0.6)
          .foregroundStyle(palette.tertiaryText)

        Text(digest.editionLabel)
          .font(.system(size: large ? 18 : 16, weight: .semibold, design: .rounded))
          .foregroundStyle(palette.primaryText)
          .lineLimit(1)
          .minimumScaleFactor(0.72)
      }
      .layoutPriority(1)

      Spacer(minLength: 8)

      if let createdDate = digest.createdDate {
        Text(createdDate, style: .time)
          .font(.caption.monospacedDigit())
          .foregroundStyle(palette.secondaryText)
          .padding(.horizontal, 8)
          .padding(.vertical, 5)
          .background(palette.chipFill, in: Capsule())
      }
    }
  }
}

private struct DigestGlyph: View {
  let symbolName: String
  let palette: WidgetPalette
  let large: Bool

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: large ? 12 : 10, style: .continuous)
        .fill(palette.accent.opacity(0.16))

      RoundedRectangle(cornerRadius: large ? 12 : 10, style: .continuous)
        .strokeBorder(palette.divider, lineWidth: 1)

      Image(systemName: symbolName)
        .font(.system(size: large ? 17 : 15, weight: .semibold))
        .foregroundStyle(palette.accent)
    }
    .frame(width: large ? 38 : 34, height: large ? 38 : 34)
  }
}

private struct DigestInlineAccessoryView: View {
  let entry: DigestSummaryEntry

  var body: some View {
    if let digest = entry.digest {
      Label("\(digest.shortEditionLabel) digest ready", systemImage: digest.symbolName)
    } else {
      Label("Digest pending", systemImage: "newspaper.fill")
    }
  }
}

private struct DigestRectangularAccessoryView: View {
  let entry: DigestSummaryEntry

  var body: some View {
    if let digest = entry.digest {
      VStack(alignment: .leading, spacing: 4) {
        Label(digest.editionLabel, systemImage: digest.symbolName)
          .font(.caption2.weight(.semibold))
        Text(digest.plainSummary.isEmpty ? "Tap for the latest digest." : digest.plainSummary)
          .font(.caption)
          .lineLimit(2)
        if let createdDate = digest.createdDate {
          Text(createdDate, style: .time)
            .font(.caption2.monospacedDigit())
            .foregroundStyle(.secondary)
        }
      }
    } else {
      VStack(alignment: .leading, spacing: 4) {
        Label("Siouxland Digest", systemImage: "newspaper.fill")
          .font(.caption2.weight(.semibold))
        Text("No digest available")
          .font(.caption)
      }
    }
  }
}

#if DEBUG
@available(iOS 17.0, *)
#Preview("Digest Medium", as: .systemMedium) {
  DigestSummaryWidget()
} timeline: {
  PreviewFixtures.digestSummaryEntry()
}

@available(iOS 17.0, *)
#Preview("Digest Large", as: .systemLarge) {
  DigestSummaryWidget()
} timeline: {
  PreviewFixtures.digestSummaryEntry()
}
#endif
