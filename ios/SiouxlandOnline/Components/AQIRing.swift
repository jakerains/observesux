import SwiftUI

// MARK: - Circular AQI Gauge

struct AQIRing: View {
    let value: Int
    let category: AQICategory
    var size: CGFloat = 80

    private var progress: Double {
        min(Double(value) / 500.0, 1.0)
    }

    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(Color.gray.opacity(0.2), lineWidth: 8)

            // Progress ring
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    category.color,
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            // Center label
            VStack(spacing: 2) {
                Text(value, format: .number)
                    .font(.slDataMedium)
                    .bold()

                Text("AQI")
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: size, height: size)
    }
}

#Preview {
    HStack(spacing: 20) {
        AQIRing(value: 42, category: .good)
        AQIRing(value: 105, category: .unhealthySensitive)
        AQIRing(value: 180, category: .unhealthy)
    }
}
