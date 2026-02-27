import SwiftUI

struct ProfileView: View {
    @Environment(AuthSession.self) private var authSession
    @State private var viewModel = ProfileViewModel()
    @FocusState private var focusedField: Field?

    private enum Field { case username, displayName, email, currentPassword, newPassword, confirmPassword }

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                form
            }
        }
        .navigationTitle("Profile")
        .task { await viewModel.load() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if viewModel.isSaving {
                    ProgressView()
                } else {
                    Button("Save") {
                        focusedField = nil
                        Task { await viewModel.save(authSession: authSession) }
                    }
                    .disabled(!viewModel.canSave)
                    .fontWeight(.semibold)
                }
            }
        }
        .alert("Error", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }

    // MARK: - Form

    private var form: some View {
        Form {
            // Avatar header
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 10) {
                        avatarCircle
                        if let profile = viewModel.profile {
                            VStack(spacing: 2) {
                                Text(profile.displayName ?? profile.username)
                                    .font(.title3.bold())
                                Text("@\(profile.username)")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            if profile.isAdmin {
                                Label("Admin", systemImage: "shield.fill")
                                    .font(.caption.bold())
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 3)
                                    .background(Color.orange, in: Capsule())
                            }
                            Text("Member since \(profile.createdAt.formatted(.dateTime.month(.wide).year()))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Spacer()
                }
                .padding(.vertical, 8)
                .listRowBackground(Color.clear)
            }

            // Account info
            Section("Account") {
                LabeledContent("Username") {
                    TextField("Required", text: $viewModel.username)
                        .multilineTextAlignment(.trailing)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .username)
                        .submitLabel(.next)
                        .onSubmit { focusedField = .displayName }
                }
                LabeledContent("Display Name") {
                    TextField("Optional", text: $viewModel.displayName)
                        .multilineTextAlignment(.trailing)
                        .focused($focusedField, equals: .displayName)
                        .submitLabel(.next)
                        .onSubmit { focusedField = .email }
                }
                LabeledContent("Email") {
                    TextField("Optional", text: $viewModel.email)
                        .multilineTextAlignment(.trailing)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .email)
                        .submitLabel(.done)
                        .onSubmit { focusedField = nil }
                }
            }

            // Password change
            Section {
                SecureField("Current Password", text: $viewModel.currentPassword)
                    .focused($focusedField, equals: .currentPassword)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .newPassword }
                SecureField("New Password", text: $viewModel.newPassword)
                    .focused($focusedField, equals: .newPassword)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .confirmPassword }
                SecureField("Confirm New Password", text: $viewModel.confirmPassword)
                    .focused($focusedField, equals: .confirmPassword)
                    .submitLabel(.done)
                    .onSubmit { focusedField = nil }

                if let error = viewModel.passwordValidationError {
                    Label(error, systemImage: "exclamationmark.circle")
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            } header: {
                Text("Change Password")
            } footer: {
                Text("Leave blank to keep your current password.")
            }

            if viewModel.saveSucceeded {
                Section {
                    Label("Profile saved successfully.", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                }
            }
        }
    }

    // MARK: - Avatar

    private var avatarCircle: some View {
        let initials = viewModel.profile.map { p in
            let name = p.displayName ?? p.username
            return name.split(separator: " ")
                .prefix(2)
                .compactMap { $0.first }
                .map { String($0).uppercased() }
                .joined()
        } ?? "?"

        return Text(initials)
            .font(.largeTitle.bold())
            .foregroundStyle(.white)
            .frame(width: 80, height: 80)
            .background(Color.accentColor, in: Circle())
    }
}

#Preview {
    NavigationStack { ProfileView() }
        .environment(AuthSession())
}
