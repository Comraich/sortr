import Foundation

enum APIEndpoint {
    // MARK: - Auth
    case login
    case register
    case logout
    case profile
    case updateProfile

    // MARK: - Users (admin)
    case users
    case user(id: Int)
    case createUser
    case updateUser(id: Int)
    case deleteUser(id: Int)

    // MARK: - Items
    case items(
        skip: Int = 0,
        limit: Int = 100,
        search: String? = nil,
        category: String? = nil,
        locationId: Int? = nil,
        boxId: Int? = nil,
        isFavorite: Bool? = nil,
        sortBy: String? = nil,
        sortOrder: String? = nil,
        dateFrom: String? = nil,
        dateTo: String? = nil
    )
    case item(id: Int)
    case createItem
    case updateItem(id: Int)
    case deleteItem(id: Int)
    case uploadItemImages(itemId: Int)
    case deleteItemImage(itemId: Int, filename: String)

    // MARK: - Locations
    case locations
    case location(id: Int)
    case createLocation
    case updateLocation(id: Int)
    case deleteLocation(id: Int)

    // MARK: - Boxes
    case boxes(locationId: Int? = nil)
    case box(id: Int)
    case createBox
    case updateBox(id: Int)
    case deleteBox(id: Int)

    // MARK: - Categories
    case categories
    case createCategory
    case updateCategory(id: Int)
    case deleteCategory(id: Int)

    // MARK: - Comments
    case comments(itemId: Int)
    case createComment
    case updateComment(id: Int)
    case deleteComment(id: Int)

    // MARK: - Notifications
    case notifications(unreadOnly: Bool = false)
    case unreadCount
    case markNotificationRead(id: Int)
    case markAllNotificationsRead
    case deleteNotification(id: Int)

    // MARK: - Shares
    case shares
    case createShare
    case deleteShare(id: Int)
    case resourceShares(type: String, id: Int)

    // MARK: - Activities
    case activities(
        skip: Int = 0,
        limit: Int = 50,
        userId: Int? = nil,
        entityType: String? = nil,
        action: String? = nil,
        dateFrom: String? = nil,
        dateTo: String? = nil
    )
    case recentActivities(hours: Int = 24, limit: Int = 50)
    case entityActivities(type: String, id: Int)
    case activityStats

    // MARK: - Stats
    case stats
    case statsTrends(days: Int = 30)

    // MARK: - Suggestions
    case suggestCategory(name: String)
    case suggestSimilar(id: Int)
    case suggestDuplicates(name: String, excludeId: Int? = nil)
    case suggestEmptyBoxes(locationId: Int? = nil)
    case autocomplete(query: String, limit: Int = 10)
    case suggestBoxForItem(category: String, locationId: Int? = nil)

    // MARK: - Expiration
    case expiredItems
    case expiringSoon(days: Int = 7)
    case allExpirationItems
    case checkAndNotify

    // MARK: - Export / Import
    case exportCSV
    case exportJSON
    case exportTemplate
    case importCSV(preview: Bool = false)

    // MARK: - Health
    case health

    // MARK: - Computed properties

    var path: String {
        switch self {
        case .login:                        return "/api/login"
        case .register:                     return "/api/register"
        case .logout:                       return "/api/logout"
        case .profile, .updateProfile:      return "/api/profile"
        case .users, .createUser:           return "/api/users"
        case .user(let id):                 return "/api/users/\(id)"
        case .updateUser(let id):           return "/api/users/\(id)"
        case .deleteUser(let id):           return "/api/users/\(id)"
        case .items:                        return "/api/items"
        case .item(let id):                 return "/api/items/\(id)"
        case .createItem:                   return "/api/items"
        case .updateItem(let id):           return "/api/items/\(id)"
        case .deleteItem(let id):           return "/api/items/\(id)"
        case .uploadItemImages(let id):     return "/api/items/\(id)/images"
        case .deleteItemImage(let id, let fn): return "/api/items/\(id)/images/\(fn)"
        case .locations, .createLocation:   return "/api/locations"
        case .location(let id):             return "/api/locations/\(id)"
        case .updateLocation(let id):       return "/api/locations/\(id)"
        case .deleteLocation(let id):       return "/api/locations/\(id)"
        case .boxes:                        return "/api/boxes"
        case .box(let id):                  return "/api/boxes/\(id)"
        case .createBox:                    return "/api/boxes"
        case .updateBox(let id):            return "/api/boxes/\(id)"
        case .deleteBox(let id):            return "/api/boxes/\(id)"
        case .categories, .createCategory:  return "/api/categories"
        case .updateCategory(let id):       return "/api/categories/\(id)"
        case .deleteCategory(let id):       return "/api/categories/\(id)"
        case .comments(let itemId):         return "/api/comments/item/\(itemId)"
        case .createComment:                return "/api/comments"
        case .updateComment(let id):        return "/api/comments/\(id)"
        case .deleteComment(let id):        return "/api/comments/\(id)"
        case .notifications:                return "/api/notifications"
        case .unreadCount:                  return "/api/notifications/unread/count"
        case .markNotificationRead(let id): return "/api/notifications/\(id)/read"
        case .markAllNotificationsRead:     return "/api/notifications/read-all"
        case .deleteNotification(let id):   return "/api/notifications/\(id)"
        case .shares, .createShare:         return "/api/shares"
        case .deleteShare(let id):          return "/api/shares/\(id)"
        case .resourceShares(let t, let id): return "/api/shares/resource/\(t)/\(id)"
        case .activities:                   return "/api/activities"
        case .recentActivities:             return "/api/activities/recent"
        case .entityActivities(let t, let id): return "/api/activities/entity/\(t)/\(id)"
        case .activityStats:                return "/api/activities/stats"
        case .stats:                        return "/api/stats"
        case .statsTrends:                  return "/api/stats/trends"
        case .suggestCategory:              return "/api/suggestions/category"
        case .suggestSimilar(let id):       return "/api/suggestions/similar/\(id)"
        case .suggestDuplicates:            return "/api/suggestions/duplicates"
        case .suggestEmptyBoxes:            return "/api/suggestions/empty-boxes"
        case .autocomplete:                 return "/api/suggestions/autocomplete"
        case .suggestBoxForItem:            return "/api/suggestions/box-for-item"
        case .expiredItems:                 return "/api/expiration/expired"
        case .expiringSoon:                 return "/api/expiration/expiring-soon"
        case .allExpirationItems:           return "/api/expiration/all"
        case .checkAndNotify:               return "/api/expiration/check-and-notify"
        case .exportCSV:                    return "/api/export/csv"
        case .exportJSON:                   return "/api/export/json"
        case .exportTemplate:               return "/api/export/template"
        case .importCSV:                    return "/api/export/csv-import"
        case .health:                       return "/health"
        }
    }

    var method: String {
        switch self {
        case .login, .register, .logout, .createItem, .createLocation, .createBox,
             .createCategory, .createComment, .createShare, .createUser,
             .markAllNotificationsRead, .checkAndNotify, .exportCSV, .importCSV:
            return "POST"
        case .updateProfile, .updateItem, .updateLocation, .updateBox,
             .updateCategory, .updateComment, .updateUser,
             .markNotificationRead:
            return "PUT"
        case .deleteItem, .deleteLocation, .deleteBox, .deleteCategory,
             .deleteComment, .deleteShare, .deleteNotification, .deleteUser,
             .deleteItemImage:
            return "DELETE"
        default:
            return "GET"
        }
    }

    var queryItems: [URLQueryItem] {
        switch self {
        case .items(let skip, let limit, let search, let category, let locationId,
                    let boxId, let isFavorite, let sortBy, let sortOrder, let dateFrom, let dateTo):
            var items = [URLQueryItem]()
            if skip > 0 { items.append(.init(name: "skip", value: "\(skip)")) }
            items.append(.init(name: "limit", value: "\(limit)"))
            if let search, !search.isEmpty { items.append(.init(name: "search", value: search)) }
            if let category { items.append(.init(name: "category", value: category)) }
            if let locationId { items.append(.init(name: "locationId", value: "\(locationId)")) }
            if let boxId { items.append(.init(name: "boxId", value: "\(boxId)")) }
            if let isFavorite { items.append(.init(name: "isFavorite", value: isFavorite ? "true" : "false")) }
            if let sortBy { items.append(.init(name: "sortBy", value: sortBy)) }
            if let sortOrder { items.append(.init(name: "sortOrder", value: sortOrder)) }
            if let dateFrom { items.append(.init(name: "dateFrom", value: dateFrom)) }
            if let dateTo { items.append(.init(name: "dateTo", value: dateTo)) }
            return items

        case .boxes(let locationId):
            if let locationId { return [.init(name: "locationId", value: "\(locationId)")] }
            return []

        case .notifications(let unreadOnly):
            return unreadOnly ? [.init(name: "unreadOnly", value: "true")] : []

        case .activities(let skip, let limit, let userId, let entityType, let action, let dateFrom, let dateTo):
            var items = [URLQueryItem]()
            if skip > 0 { items.append(.init(name: "skip", value: "\(skip)")) }
            items.append(.init(name: "limit", value: "\(limit)"))
            if let userId { items.append(.init(name: "userId", value: "\(userId)")) }
            if let entityType { items.append(.init(name: "entityType", value: entityType)) }
            if let action { items.append(.init(name: "action", value: action)) }
            if let dateFrom { items.append(.init(name: "dateFrom", value: dateFrom)) }
            if let dateTo { items.append(.init(name: "dateTo", value: dateTo)) }
            return items

        case .recentActivities(let hours, let limit):
            return [.init(name: "hours", value: "\(hours)"), .init(name: "limit", value: "\(limit)")]

        case .statsTrends(let days):
            return [.init(name: "days", value: "\(days)")]

        case .suggestCategory(let name):
            return [.init(name: "name", value: name)]

        case .suggestDuplicates(let name, let excludeId):
            var items: [URLQueryItem] = [.init(name: "name", value: name)]
            if let excludeId { items.append(.init(name: "excludeId", value: "\(excludeId)")) }
            return items

        case .suggestEmptyBoxes(let locationId):
            if let locationId { return [.init(name: "locationId", value: "\(locationId)")] }
            return []

        case .autocomplete(let query, let limit):
            return [.init(name: "query", value: query), .init(name: "limit", value: "\(limit)")]

        case .suggestBoxForItem(let category, let locationId):
            var items: [URLQueryItem] = [.init(name: "category", value: category)]
            if let locationId { items.append(.init(name: "locationId", value: "\(locationId)")) }
            return items

        case .expiringSoon(let days):
            return [.init(name: "days", value: "\(days)")]

        case .importCSV(let preview):
            return preview ? [.init(name: "preview", value: "true")] : []

        default:
            return []
        }
    }

    /// Whether this endpoint requires authentication
    var requiresAuth: Bool {
        switch self {
        case .login, .register, .health:
            return false
        default:
            return true
        }
    }
}
