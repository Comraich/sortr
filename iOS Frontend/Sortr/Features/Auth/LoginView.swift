import SwiftUI

struct LoginView: View {
    @Environment(AuthSession.self) private var authSession
    @State private var username = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // MARK: Logo
                VStack(spacing: 8) {
                    Image(systemName: "archivebox.fill")
                        .font(.system(size: 64))
                        .foregroundStyle(.tint)

                    Text("Sortr")
                        .font(.largeTitle.bold())

                    Text("Inventory management")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 48)

                // MARK: Fields
                VStack(spacing: 12) {
                    // Username
                    HStack(spacing: 12) {
                        Image(systemName: "person")
                            .foregroundStyle(.secondary)
                            .frame(width: 20)
                        TextField("Username", text: $username)
                            .textContentType(.username)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                    }
                    .padding(14)
                    .background(.fill.tertiary, in: RoundedRectangle(cornerRadius: 12))

                    // Password
                    HStack(spacing: 12) {
                        Image(systemName: "lock")
                            .foregroundStyle(.secondary)
                            .frame(width: 20)
                        SecureField("Password", text: $password)
                            .textContentType(.password)
                            .onSubmit {
                                Task { await performLogin() }
                            }
                    }
                    .padding(14)
                    .background(.fill.tertiary, in: RoundedRectangle(cornerRadius: 12))
                }

                // MARK: Inline error
                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                // MARK: Login button
                Button {
                    Task { await performLogin() }
                } label: {
                    Group {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Log In")
                                .font(.headline)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                }
                .buttonStyle(.borderedProminent)
                .disabled(username.isEmpty || password.isEmpty || isLoading)
            }
            .padding(24)
        }
    }

    private func performLogin() async {
        isLoading = true
        errorMessage = nil
        do {
            try await authSession.login(username: username, password: password)
        } catch let e as APIError {
            errorMessage = e.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

#Preview {
    LoginView()
        .environment(AuthSession(
            keychainManager: .shared,
            apiClient: .shared
        ))
}
