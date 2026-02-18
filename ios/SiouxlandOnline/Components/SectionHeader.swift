import SwiftUI

// MARK: - Section Header
// Uppercase label with gradient divider line (matches web's SectionHeader component)

struct SectionHeader: View {
    let title: String

    var body: some View {
        HStack(spacing: 12) {
            Text(title)
                .slSectionHeaderStyle()

            // Gradient divider line extending to fill width
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [Color("SlBorder"), Color("SlBorder").opacity(0)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(height: 1)
        }
        .padding(.top, 8)
        .padding(.bottom, 4)
    }
}

#Preview {
    VStack(spacing: 20) {
        SectionHeader(title: "Live Updates")
        SectionHeader(title: "Conditions & Services")
        SectionHeader(title: "More Info")
    }
    .padding()
    .background(Color("SlBackground"))
}
