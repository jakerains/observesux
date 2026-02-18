import SwiftUI

struct ErrorStateView: View {
    let message: String
    let onRetry: (() async -> Void)?

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 32))
                .foregroundStyle(.slError)

            Text(message)
                .font(.slBody)
                .foregroundStyle(Color("SlMutedForeground"))
                .multilineTextAlignment(.center)

            if let onRetry {
                Button {
                    Task { await onRetry() }
                } label: {
                    Label("Retry", systemImage: "arrow.clockwise")
                        .font(.slBody)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color("SlPrimary"))
            }
        }
        .padding()
    }
}
