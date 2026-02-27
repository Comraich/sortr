import Foundation

struct UserProfile: Decodable {
    let id: Int
    let username: String
    let email: String?
    let displayName: String?
    let isAdmin: Bool
    let createdAt: Date
    let updatedAt: Date
}
