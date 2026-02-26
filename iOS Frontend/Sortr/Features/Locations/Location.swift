import Foundation

/// Full location with parent/children references.
struct Location: Decodable, Identifiable {
    let id: Int
    let name: String
    let parentId: Int?
    let createdAt: Date
    let updatedAt: Date

    // Sequelize `as:` aliases — PascalCase becomes lowercase via .convertFromSnakeCase
    let parent: LocationSummary?
    let children: [LocationSummary]
}

/// Lightweight location reference returned inside relations (id + name only).
struct LocationSummary: Decodable, Identifiable {
    let id: Int
    let name: String
}

/// A storage box that belongs to a location.
struct Box: Decodable, Identifiable {
    let id: Int
    let name: String
    let locationId: Int
    let createdAt: Date
    let updatedAt: Date

    // Included relation — PascalCase key decoded to lowercase property
    let location: LocationSummary?
}
