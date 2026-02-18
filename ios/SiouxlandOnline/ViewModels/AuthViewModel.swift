import Foundation

@Observable
@MainActor
final class AuthViewModel {
    var email = ""
    var password = ""
    var name = ""
    var isLoading = false
    var error: String?

    func signIn(appState: AppState) async {
        isLoading = true
        error = nil

        do {
            struct SignInBody: Encodable {
                let email: String
                let password: String
            }

            struct SignInResponse: Decodable {
                let token: String?
                let user: UserProfile?
            }

            let response: SignInResponse = try await APIClient.shared.post(
                Endpoints.signIn,
                body: SignInBody(email: email, password: password)
            )

            if let token = response.token {
                KeychainManager.save(token, for: .authToken)
                appState.isAuthenticated = true
                appState.currentUser = response.user
            }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func signUp(appState: AppState) async {
        isLoading = true
        error = nil

        do {
            struct SignUpBody: Encodable {
                let email: String
                let password: String
                let name: String
            }

            struct SignUpResponse: Decodable {
                let token: String?
                let user: UserProfile?
            }

            let response: SignUpResponse = try await APIClient.shared.post(
                Endpoints.signUp,
                body: SignUpBody(email: email, password: password, name: name)
            )

            if let token = response.token {
                KeychainManager.save(token, for: .authToken)
                appState.isAuthenticated = true
                appState.currentUser = response.user
            }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}
