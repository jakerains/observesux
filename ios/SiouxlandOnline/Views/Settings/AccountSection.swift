import SwiftUI

struct AccountSection: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        Section("Account") {
            if appState.isAuthenticated {
                if let user = appState.currentUser {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .font(.title)
                            .foregroundStyle(.slWarmAmber)

                        VStack(alignment: .leading) {
                            Text(user.name ?? "User")
                                .font(.slWidgetTitle)
                            if let email = user.email {
                                Text(email)
                                    .font(.slCompact)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                Button("Sign Out", role: .destructive) {
                    appState.signOut()
                }
            } else {
                NavigationLink("Sign In") {
                    SignInView()
                }
            }
        }
    }
}
