import SwiftUI
import MapKit

struct TrafficAnnotation: View {
    let event: TrafficEvent

    var body: some View {
        Image(systemName: "exclamationmark.triangle.fill")
            .font(.caption)
            .foregroundStyle(.white)
            .padding(5)
            .background(severityColor, in: Circle())
    }

    private var severityColor: Color {
        switch event.severity {
        case .minor: .yellow
        case .moderate: .orange
        case .major: .red
        case .critical: .slSeverityCritical
        }
    }
}
