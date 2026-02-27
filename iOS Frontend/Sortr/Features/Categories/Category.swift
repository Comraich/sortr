import Foundation

struct Category: Decodable, Identifiable {
    let id: Int
    let name: String
    let itemCount: Int?
    let createdAt: Date
    let updatedAt: Date
}
