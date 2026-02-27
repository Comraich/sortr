import Foundation

struct ActivityLog: Decodable, Identifiable {
    let id: Int
    let action: String
    let entityType: String
    let entityId: Int
    let user: ActivityUser?
    let createdAt: Date

    struct ActivityUser: Decodable {
        let id: Int
        let username: String
    }

    var iconName: String {
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
        return "\(user?.username ?? "Unknown") \(verb) \(entityType) #\(entityId)"
    }
}
