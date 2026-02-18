import SwiftUI

struct SignInView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = AuthViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                // Logo
                Text("SUX")
                    .font(.slHero)
                    .foregroundStyle(.slWarmAmber)

                Text("Sign in to Siouxland Online")
                    .font(.slBody)
                    .foregroundStyle(.secondary)

                // Form
                VStack(spacing: 16) {
                    TextField("Email", text: $viewModel.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .padding()
                        .background(Color.gray.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))

                    SecureField("Password", text: $viewModel.password)
                        .textContentType(.password)
                        .padding()
                        .background(Color.gray.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                }

                if let error = viewModel.error {
                    Text(error)
                        .font(.slCompact)
                        .foregroundStyle(.red)
                }

                Button {
                    Task {
                        await viewModel.signIn(appState: appState)
                        if appState.isAuthenticated {
                            dismiss()
                        }
                    }
                } label: {
                    if viewModel.isLoading {
                        ProgressView()
                    } else {
                        Text("Sign In")
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(.slWarmAmber)
                .disabled(viewModel.isLoading)

                NavigationLink("Create an account") {
                    SignUpView()
                }
                .font(.slBody)

                Spacer()
            }
            .padding()
            .navigationTitle("Sign In")
        }
    }
}
