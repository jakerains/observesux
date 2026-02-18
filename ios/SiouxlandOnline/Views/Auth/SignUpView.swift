import SwiftUI

struct SignUpView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = AuthViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("Create Account")
                .font(.slWidgetTitle)

            VStack(spacing: 16) {
                TextField("Name", text: $viewModel.name)
                    .textContentType(.name)
                    .padding()
                    .background(Color.gray.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))

                TextField("Email", text: $viewModel.email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .padding()
                    .background(Color.gray.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))

                SecureField("Password", text: $viewModel.password)
                    .textContentType(.newPassword)
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
                    await viewModel.signUp(appState: appState)
                    if appState.isAuthenticated {
                        dismiss()
                    }
                }
            } label: {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    Text("Create Account")
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(.slWarmAmber)
            .disabled(viewModel.isLoading)

            Spacer()
        }
        .padding()
        .navigationTitle("Sign Up")
    }
}
