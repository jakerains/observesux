import SwiftUI
import MapKit

struct SnowplowAnnotation: View {
    let plow: Snowplow

    var body: some View {
        Image(systemName: "snowflake")
            .font(.caption)
            .foregroundStyle(.white)
            .padding(4)
            .background(activityColor, in: Circle())
            .rotationEffect(.degrees(plow.heading))
    }

    private var activityColor: Color {
        switch plow.activity {
        case .plowing: .blue
        case .salting: .orange
        case .both: .purple
        case .deadheading: .gray
        case .parked: .gray.opacity(0.5)
        }
    }
}
