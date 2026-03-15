import SwiftUI
import WidgetKit

@main
struct SiouxlandWidgetsExtension: WidgetBundle {
  var body: some Widget {
    SunDaylightWidget()
    DigestSummaryWidget()
    SunDaylightActivityWidget()
  }
}
