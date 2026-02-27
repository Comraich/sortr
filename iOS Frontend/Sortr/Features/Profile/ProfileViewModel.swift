import Foundation

@Observable
@MainActor
final class ProfileViewModel {
    var profile: UserProfile?
    var isLoading = false
    var isSaving = false
    var errorMessage: String?
    var saveSucceeded = false

    // Editable fields — populated once profile loads
    var username = ""
    var displayName = ""
    var email = ""

    // Password change fields
    var currentPassword = ""
    var newPassword = ""
    var confirmPassword = ""

    func load() async {
        if profile == nil { isLoading = true }
        errorMessage = nil
        do {
            let p: UserProfile = try await APIClient.shared.request(.profile)
            profile = p
            username    = p.username
            displayName = p.displayName ?? ""
            email       = p.email ?? ""
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }

    var passwordValidationError: String? {
        guard !newPassword.isEmpty else { return nil }
        if newPassword.count < 6 { return "New password must be at least 6 characters" }
        if newPassword != confirmPassword { return "Passwords don't match" }
        if currentPassword.isEmpty { return "Current password is required" }
        return nil
    }

    var canSave: Bool {
        !username.trimmingCharacters(in: .whitespaces).isEmpty
            && passwordValidationError == nil
            && !isSaving
    }

    func save(authSession: AuthSession) async {
        guard canSave else { return }
        isSaving = true
        errorMessage = nil
        saveSucceeded = false
        do {
            let body = ProfileUpdateRequest(
                username:        username.trimmingCharacters(in: .whitespaces),
                email:           email.trimmingCharacters(in: .whitespaces),
                displayName:     displayName.trimmingCharacters(in: .whitespaces),
                currentPassword: currentPassword.isEmpty ? nil : currentPassword,
                newPassword:     newPassword.isEmpty     ? nil : newPassword
            )
            let updated: UserProfile = try await APIClient.shared.request(.updateProfile, body: body)
            profile = updated
            // Sync display name / username back into the session
            authSession.updateCurrentUser(AuthUser(
                id:          updated.id,
                username:    updated.username,
                displayName: updated.displayName,
                isAdmin:     updated.isAdmin
            ))
            currentPassword = ""
            newPassword     = ""
            confirmPassword = ""
            saveSucceeded   = true
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isSaving = false
    }
}

// MARK: - Request body

private struct ProfileUpdateRequest: Encodable {
    let username: String
    let email: String
    let displayName: String
    let currentPassword: String?
    let newPassword: String?
}
