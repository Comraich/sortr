import Foundation

struct Item: Decodable, Identifiable {
    let id: Int
    let name: String
    let category: String?
    let description: String?
    let images: [String]?
    let tags: [String]?
    let isFavorite: Bool
    let expirationDate: Date?
    let locationId: Int?
    let boxId: Int?
    let createdAt: Date
    let updatedAt: Date

    // Eagerly-loaded relations from Sequelize (PascalCase keys → lowercased by .convertFromSnakeCase)
    let location: ItemLocation?
    let box: ItemBox?

    // MARK: - Nested relation types

    struct ItemLocation: Decodable, Identifiable {
        let id: Int
        let name: String
    }

    struct ItemBox: Decodable, Identifiable {
        let id: Int
        let name: String
        let location: ItemLocation?
    }

    // MARK: - Computed

    /// Location to show: direct location, or the box's parent location.
    var displayLocation: ItemLocation? { location ?? box?.location }

    var expirationStatus: ExpirationStatus {
        guard let exp = expirationDate else { return .none }
        let today = Calendar.current.startOfDay(for: .now)
        if exp < today { return .expired }
        let soonThreshold = Calendar.current.date(byAdding: .day, value: 7, to: today)!
        if exp <= soonThreshold { return .expiringSoon }
        return .ok
    }

    enum ExpirationStatus: Equatable {
        case none, ok, expiringSoon, expired
    }
}
