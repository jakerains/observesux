import SwiftUI
import MapKit

struct CameraAnnotation: View {
    let camera: TrafficCamera

    var body: some View {
        Image(systemName: "video.fill")
            .font(.caption)
            .foregroundStyle(.white)
            .padding(6)
            .background(.blue, in: Circle())
            .overlay(Circle().stroke(.white, lineWidth: 1.5))
    }
}
