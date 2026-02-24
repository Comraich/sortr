import Foundation
import Security

enum KeychainError: Error {
    case saveFailed(OSStatus)
    case readFailed(OSStatus)
    case deleteFailed(OSStatus)
}

final class KeychainManager {
    static let shared = KeychainManager()

    private let service = "net.comraich.sortr"
    private let lock = NSLock()

    enum Key: String, CaseIterable {
        case token = "jwt_token"
        case userId = "user_id"
        case username = "username"
        case displayName = "display_name"
        case isAdmin = "is_admin"
    }

    // MARK: - Token

    func saveToken(_ token: String) throws {
        try save(value: token, for: .token)
    }

    func getToken() -> String? {
        try? read(for: .token)
    }

    func deleteToken() {
        delete(for: .token)
    }

    // MARK: - User Metadata

    func saveUser(_ user: AuthUser) throws {
        try saveInt(user.id, for: .userId)
        try save(value: user.username, for: .username)
        try save(value: user.displayName ?? "", for: .displayName)
        try saveBool(user.isAdmin, for: .isAdmin)
    }

    func getUser() -> AuthUser? {
        guard
            let userId = try? readInt(for: .userId),
            let username = try? read(for: .username)
        else { return nil }

        let displayName = (try? read(for: .displayName)).flatMap { $0.isEmpty ? nil : $0 }
        let isAdmin = readBool(for: .isAdmin)

        return AuthUser(id: userId, username: username, displayName: displayName, isAdmin: isAdmin)
    }

    func deleteUser() {
        Key.allCases.filter { $0 != Key.token }.forEach { delete(for: $0) }
    }

    func deleteAll() {
        Key.allCases.forEach { delete(for: $0) }
    }

    // MARK: - Private typed helpers

    private func saveInt(_ value: Int, for key: Key) throws {
        try save(value: String(value), for: key)
    }

    private func readInt(for key: Key) throws -> Int {
        let string = try read(for: key)
        guard let value = Int(string) else { throw KeychainError.readFailed(errSecDecode) }
        return value
    }

    private func saveBool(_ value: Bool, for key: Key) throws {
        try save(value: value ? "1" : "0", for: key)
    }

    private func readBool(for key: Key) -> Bool {
        (try? read(for: key)) == "1"
    }

    // MARK: - Private SecItem wrappers

    private func save(value: String, for key: Key) throws {
        lock.lock()
        defer { lock.unlock() }

        let data = Data(value.utf8)
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key.rawValue
        ]
        // Delete existing before adding (upsert pattern)
        SecItemDelete(query as CFDictionary)

        var addQuery = query
        addQuery[kSecValueData] = data
        addQuery[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        let status = SecItemAdd(addQuery as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError.saveFailed(status) }
    }

    private func read(for key: Key) throws -> String {
        lock.lock()
        defer { lock.unlock() }

        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key.rawValue,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.readFailed(status)
        }
        return string
    }

    private func delete(for key: Key) {
        lock.lock()
        defer { lock.unlock() }

        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key.rawValue
        ]
        SecItemDelete(query as CFDictionary)
    }
}

