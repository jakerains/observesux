import SwiftUI

// MARK: - Severity Badge (tinted-pill pattern)

struct SeverityBadge: View {
    let severity: TrafficSeverity

    var body: some View {
        Text(severity.rawValue.capitalized)
            .font(.slCompact)
            .fontWeight(.semibold)
            .foregroundStyle(severityColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .tintedBadge(color: severityColor)
    }

    private var severityColor: Color {
        switch severity {
        case .minor: .slSeverityMinor
        case .moderate: .slSeverityModerate
        case .major: .slSeverityMajor
        case .critical: .slSeverityCritical
        }
    }
}

// MARK: - Flood Stage Badge (tinted-pill pattern)

struct FloodStageBadge: View {
    let stage: FloodStage

    var body: some View {
        Text(stage.rawValue.capitalized)
            .font(.slCompact)
            .fontWeight(.semibold)
            .foregroundStyle(stageColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .tintedBadge(color: stageColor)
    }

    private var stageColor: Color {
        switch stage {
        case .normal: .slFloodNormal
        case .action: .slFloodAction
        case .minor: .slFloodMinor
        case .moderate: .slFloodModerate
        case .major: .slFloodMajor
        }
    }
}
