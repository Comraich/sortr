import Foundation

struct AppNotification: Decodable, Identifiable {
    let id: Int
    let userId: Int
    let type: NotifType
    let message: String
    let resourceType: ResourceType?
    let resourceId: Int?
    var isRead: Bool
    let createdAt: Date
    let updatedAt: Date

    enum NotifType: String, Decodable {
        case share, comment, mention, unknown

        init(from decoder: Decoder) throws {
            let raw = try decoder.singleValueContainer().decode(String.self)
            self = NotifType(rawValue: raw) ?? .unknown
        }

        var iconName: String {
            switch self {
            case .share:   return "person.2.fill"
            case .comment: return "bubble.left.fill"
            case .mention: return "at"
            case .unknown: return "bell.fill"
            }
        }
    }

    enum ResourceType: String, Decodable {
        case item, location, box
    }
}

extension Notification.Name {
    static let notificationsChanged = Notification.Name("SortrNotificationsChanged")
}
