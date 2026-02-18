import SwiftUI

// MARK: - Loading Skeleton Placeholder

struct SkeletonView: View {
    var height: CGFloat = 20
    var width: CGFloat? = nil

    @State private var isAnimating = false

    var body: some View {
        RoundedRectangle(cornerRadius: 6)
            .fill(Color("SlBorder").opacity(0.4))
            .frame(width: width, height: height)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .fill(
                        LinearGradient(
                            colors: [.clear, Color("SlAccent").opacity(0.15), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .offset(x: isAnimating ? 200 : -200)
            )
            .clipShape(.rect(cornerRadius: 6))
            .onAppear {
                withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                    isAnimating = true
                }
            }
    }
}

// MARK: - Skeleton Card (full widget placeholder)

struct SkeletonCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                SkeletonView(height: 20, width: 120)
                Spacer()
                SkeletonView(height: 16, width: 50)
            }
            SkeletonView(height: 40)
            SkeletonView(height: 16, width: 200)
            SkeletonView(height: 16, width: 160)
        }
        .padding()
        .warmCard()
    }
}

#Preview {
    VStack(spacing: 16) {
        SkeletonCard()
        SkeletonCard()
    }
    .padding()
    .background(Color("SlBackground"))
}
