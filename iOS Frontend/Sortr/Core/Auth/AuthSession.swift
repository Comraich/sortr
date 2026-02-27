import Foundation
import Observation

/// Non-sensitive user info returned by the server on login.
/// Stored in Keychain for session restoration on app launch.
struct AuthUser: Equatable {
    let id: Int
    let username: String
    let displayName: String?
    let isAdmin: Bool

    var displayNameOrUsername: String { displayName ?? username }
}

/// Single source of truth for authentication state.
/// Injected as an `@Environment` object from `SortrApp`.
@Observable
@MainActor
final class AuthSession {
    private(set) var currentUser: AuthUser?

    convenience init() {
        self.init(keychainManager: .shared, apiClient: .shared)
    }

    var isAuthenticated: Bool { currentUser != nil }
    var isAdmin: Bool { currentUser?.isAdmin == true }

    private let keychainManager: KeychainManager
    private let apiClient: APIClient
    nonisolated(unsafe) private var sessionExpiredObserver: (any NSObjectProtocol)?

    init(keychainManager: KeychainManager, apiClient: APIClient) {
        self.keychainManager = keychainManager
        self.apiClient = apiClient

        // Restore session from Keychain on launch
        self.currentUser = keychainManager.getUser()

        // Listen for 401 responses from APIClient.
        // Block-based API: deinit cancels via the opaque token, avoiding any
        // reference to the actor-isolated .sessionExpired Notification.Name.
        sessionExpiredObserver = NotificationCenter.default.addObserver(
            forName: .sessionExpired,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleSessionExpired()
        }
    }

    deinit {
        if let observer = sessionExpiredObserver {
            NotificationCenter.default.removeObserver(observer)
        }
    }

    func login(username: String, password: String) async throws {
        let response: LoginResponse = try await apiClient.request(
            .login,
            body: LoginRequest(username: username, password: password)
        )
        try keychainManager.saveToken(response.token)
        try keychainManager.saveUser(response.user)
        currentUser = response.user
    }

    func logout() async {
        // Best-effort server logout (clears httpOnly cookie for web sessions)
        _ = try? await apiClient.request(.logout, body: EmptyBody()) as EmptyResponse
        keychainManager.deleteAll()
        currentUser = nil
    }

    func updateCurrentUser(_ user: AuthUser) {
        currentUser = user
        try? keychainManager.saveUser(user)
    }

    private func handleSessionExpired() {
        keychainManager.deleteAll()
        currentUser = nil
    }
}

// MARK: - Request / Response types

struct LoginRequest: Encodable {
    let username: String
    let password: String
}

struct LoginResponse: Decodable {
    let token: String
    let user: AuthUser
}

extension AuthUser: Decodable {
    enum CodingKeys: String, CodingKey {
        case id, username, displayName, isAdmin
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        username = try container.decode(String.self, forKey: .username)
        displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
        isAdmin = try container.decode(Bool.self, forKey: .isAdmin)
    }
}

struct EmptyBody: Encodable {}
struct EmptyResponse: Decodable {}

