import SwiftUI
import MapKit

struct BusAnnotation: View {
    let bus: BusPosition

    var body: some View {
        Image(systemName: "bus.fill")
            .font(.caption)
            .foregroundStyle(.white)
            .padding(5)
            .background(Color(hex: bus.routeColor ?? "#3b82f6"), in: Circle())
            .rotationEffect(.degrees(bus.heading))
            .overlay(Circle().stroke(.white, lineWidth: 1))
    }
}
