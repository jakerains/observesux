import SwiftUI
import WidgetKit

@main
struct SiouxlandWidgetBundle: WidgetBundle {
    var body: some Widget {
        WeatherWidget()
        AQIWidget()
        RiverWidget()
    }
}
