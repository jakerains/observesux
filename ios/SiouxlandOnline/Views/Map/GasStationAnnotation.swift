import SwiftUI
import MapKit

struct GasStationAnnotation: View {
    let station: GasStation

    var body: some View {
        VStack(spacing: 1) {
            if let price = station.prices.first(where: { $0.fuelType == .regular }) {
                Text(price.price, format: .currency(code: "USD"))
                    .font(.slCompact)
                    .bold()
                    .foregroundStyle(.white)
            }
            Image(systemName: "fuelpump.fill")
                .font(.caption2)
                .foregroundStyle(.white)
        }
        .padding(4)
        .background(.green.opacity(0.8), in: RoundedRectangle(cornerRadius: 6))
    }
}
