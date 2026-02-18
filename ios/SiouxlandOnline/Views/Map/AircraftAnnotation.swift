import SwiftUI
import MapKit

struct AircraftAnnotation: View {
    let aircraft: Aircraft

    var body: some View {
        Image(systemName: "airplane")
            .font(.caption)
            .foregroundStyle(associationColor)
            .rotationEffect(.degrees(aircraft.heading ?? 0))
    }

    private var associationColor: Color {
        switch aircraft.suxAssociation {
        case .arriving: .green
        case .departing: .blue
        case .nearby: .gray
        case nil: .gray
        }
    }
}
