import SwiftUI

struct UsersView: View {
    @Environment(AuthSession.self) private var authSession
    @State private var users: [UserProfile] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var editingUser: UserProfile?   // nil = create new
    @State private var showingForm = false

    var body: some View {
        content
            .navigationTitle("Users")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        editingUser = nil
                        showingForm = true
                    } label: {
                        Image(systemName: "person.badge.plus")
                    }
                }
            }
            .task { await load() }
            .refreshable { await load() }
            .sheet(isPresented: $showingForm) {
                UserFormSheet(user: editingUser) { await load() }
            }
            .alert("Error", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
    }

    @ViewBuilder
    private var content: some View {
        if users.isEmpty {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ContentUnavailableView(
                    "No Users",
                    systemImage: "person.3",
                    description: Text("Tap + to add a user.")
                )
            }
        } else {
            List {
                ForEach(users) { user in
                    UserRow(user: user, currentUserId: authSession.currentUser?.id)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            editingUser = user
                            showingForm = true
                        }
                        .swipeActions(edge: .trailing) {
                            if user.id != authSession.currentUser?.id {
                                Button(role: .destructive) {
                                    Task { await delete(user) }
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                }
            }
            .listStyle(.plain)
        }
    }

    private func load() async {
        if users.isEmpty { isLoading = true }
        errorMessage = nil
        do {
            users = try await APIClient.shared.request(.users)
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }

    private func delete(_ user: UserProfile) async {
        users.removeAll { $0.id == user.id }
        do {
            let _: MessageResponse = try await APIClient.shared.request(.deleteUser(id: user.id))
        } catch {
            await load()
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
    }
}

// MARK: - User row

private struct UserRow: View {
    let user: UserProfile
    let currentUserId: Int?

    var body: some View {
        HStack(spacing: 12) {
            // Initials circle
            let initials = (user.displayName ?? user.username)
                .split(separator: " ").prefix(2)
                .compactMap { $0.first }
                .map { String($0).uppercased() }
                .joined()
            Text(initials.isEmpty ? "?" : initials)
                .font(.subheadline.bold())
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Color.accentColor, in: Circle())

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(user.displayName ?? user.username)
                        .font(.subheadline.bold())
                    if user.id == currentUserId {
                        Text("You")
                            .font(.caption2.bold())
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.accentColor, in: Capsule())
                    }
                    if user.isAdmin {
                        Text("Admin")
                            .font(.caption2.bold())
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange, in: Capsule())
                    }
                }
                Text("@\(user.username)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let email = user.email {
                    Text(email)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Create / edit sheet

private struct UserFormSheet: View {
    let user: UserProfile?      // nil → create
    let onSave: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var username = ""
    @State private var displayName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isAdmin = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @FocusState private var focusedField: Field?

    private enum Field { case username, displayName, email, password }
    private var isEditing: Bool { user != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Account") {
                    TextField("Username", text: $username)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .username)
                        .submitLabel(.next)
                        .onSubmit { focusedField = .displayName }
                    TextField("Display Name", text: $displayName)
                        .focused($focusedField, equals: .displayName)
                        .submitLabel(.next)
                        .onSubmit { focusedField = .email }
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .email)
                        .submitLabel(.next)
                        .onSubmit { focusedField = .password }
                }

                Section {
                    SecureField(isEditing ? "New Password (leave blank to keep)" : "Password", text: $password)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.done)
                        .onSubmit { focusedField = nil }
                } footer: {
                    if isEditing { Text("Leave blank to keep the existing password.") }
                }

                Section {
                    Toggle("Admin", isOn: $isAdmin)
                }

                if let error = errorMessage {
                    Section {
                        Label(error, systemImage: "exclamationmark.circle")
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit User" : "New User")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Save") { Task { await save() } }
                            .disabled(!canSave)
                            .fontWeight(.semibold)
                    }
                }
            }
            .onAppear {
                if let u = user {
                    username    = u.username
                    displayName = u.displayName ?? ""
                    email       = u.email ?? ""
                    isAdmin     = u.isAdmin
                }
                focusedField = .username
            }
        }
    }

    private var canSave: Bool {
        let usernameOK = username.trimmingCharacters(in: .whitespaces).count >= 3
        let passwordOK = isEditing || password.count >= 6
        return usernameOK && passwordOK && !isSaving
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        do {
            if let u = user {
                // Edit
                struct UpdateBody: Encodable {
                    let username: String; let email: String; let displayName: String
                    let isAdmin: Bool; let password: String?
                }
                let _: UserProfile = try await APIClient.shared.request(
                    .updateUser(id: u.id),
                    body: UpdateBody(
                        username:    username.trimmingCharacters(in: .whitespaces),
                        email:       email.trimmingCharacters(in: .whitespaces),
                        displayName: displayName.trimmingCharacters(in: .whitespaces),
                        isAdmin:     isAdmin,
                        password:    password.isEmpty ? nil : password
                    )
                )
            } else {
                // Create
                struct CreateBody: Encodable {
                    let username: String; let email: String; let displayName: String
                    let isAdmin: Bool; let password: String
                }
                let _: UserProfile = try await APIClient.shared.request(
                    .createUser,
                    body: CreateBody(
                        username:    username.trimmingCharacters(in: .whitespaces),
                        email:       email.trimmingCharacters(in: .whitespaces),
                        displayName: displayName.trimmingCharacters(in: .whitespaces),
                        isAdmin:     isAdmin,
                        password:    password
                    )
                )
            }
            await onSave()
            dismiss()
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isSaving = false
    }
}

private struct MessageResponse: Decodable { let message: String }

#Preview {
    NavigationStack { UsersView() }
        .environment(AuthSession())
}
