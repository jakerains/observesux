import SwiftUI
import MapKit

struct RiverAnnotation: View {
    let reading: RiverGaugeReading

    var body: some View {
        VStack(spacing: 2) {
            if let height = reading.gaugeHeight {
                Text(String(format: "%.1f'", height))
                    .font(.slCompact)
                    .bold()
                    .foregroundStyle(.white)
            }
            Image(systemName: "water.waves")
                .font(.caption)
                .foregroundStyle(.white)
        }
        .padding(4)
        .background(stageColor, in: RoundedRectangle(cornerRadius: 6))
    }

    private var stageColor: Color {
        switch reading.floodStage {
        case .normal: .slFloodNormal
        case .action: .slFloodAction
        case .minor: .slFloodMinor
        case .moderate: .slFloodModerate
        case .major: .slFloodMajor
        }
    }
}
