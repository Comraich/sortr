import Foundation

struct DashboardStats: Decodable {
    let overview: Overview
    let itemsByCategory: [CategoryCount]
    let itemsByLocation: [LocationCount]
    let topBoxes: [BoxStat]
    let emptyBoxes: [EmptyBox]
    let recentItems: [RecentItem]
    let recentActivity: [ActivityEntry]

    struct Overview: Decodable {
        let totalItems: Int
        let totalBoxes: Int
        let totalLocations: Int
        let totalCategories: Int
        let itemsWithoutBox: Int
        let itemsWithoutLocation: Int
        let emptyBoxesCount: Int
        let averageItemsPerBox: Double
        let boxUtilization: Double
    }

    struct CategoryCount: Decodable, Identifiable {
        var id: String { category }
        let category: String
        let count: Int
    }

    struct LocationCount: Decodable, Identifiable {
        let id: Int
        let name: String
        let count: Int
    }

    struct BoxStat: Decodable, Identifiable {
        let id: Int
        let name: String
        let location: String
        let count: Int
    }

    struct EmptyBox: Decodable, Identifiable {
        let id: Int
        let name: String
        let location: String
    }

    struct RecentItem: Decodable, Identifiable {
        let id: Int
        let name: String
        let category: String?
        let location: String
        let box: String
        let createdAt: Date
    }

    struct ActivityEntry: Decodable, Identifiable {
        let id: Int
        let action: String
        let entityType: String
        let entityName: String?
        let user: String
        let createdAt: Date

        var actionIconName: String {
            switch action {
            case "create": return "plus.circle.fill"
            case "update": return "pencil.circle.fill"
            case "delete": return "minus.circle.fill"
            default:       return "circle.fill"
            }
        }

        var summary: String {
            let verb: String
            switch action {
            case "create": verb = "added"
            case "update": verb = "updated"
            case "delete": verb = "deleted"
            default:       verb = action
            }
            let subject = entityName.map { "\"\($0)\"" } ?? entityType
            return "\(user) \(verb) \(subject)"
        }
    }
}

struct TrendPoint: Decodable, Identifiable {
    var id: Date { date }
    let date: Date
    let count: Int
}

struct TrendsResponse: Decodable {
    let trends: [TrendPoint]
}
