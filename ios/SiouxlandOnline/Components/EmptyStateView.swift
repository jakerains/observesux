import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundStyle(Color("SlMutedForeground"))

            Text(title)
                .font(.slWidgetTitle)
                .foregroundStyle(Color("SlForeground"))

            Text(message)
                .font(.slBody)
                .foregroundStyle(Color("SlMutedForeground"))
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}
