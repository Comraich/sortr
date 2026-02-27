import Foundation

private struct MessageResponse: Decodable { let message: String }

@Observable
@MainActor
final class NotificationsViewModel {
    var notifications: [AppNotification] = []
    var isLoading = false
    var errorMessage: String?

    var unreadCount: Int { notifications.filter { !$0.isRead }.count }

    func load() async {
        if notifications.isEmpty { isLoading = true }
        errorMessage = nil
        do {
            notifications = try await APIClient.shared.request(.notifications())
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }

    func markRead(_ notification: AppNotification) async {
        guard !notification.isRead else { return }
        guard let idx = notifications.firstIndex(where: { $0.id == notification.id }) else { return }
        notifications[idx].isRead = true
        do {
            let _: AppNotification = try await APIClient.shared.request(.markNotificationRead(id: notification.id))
            NotificationCenter.default.post(name: .notificationsChanged, object: nil)
        } catch {
            notifications[idx].isRead = false
        }
    }

    func markAllRead() async {
        guard unreadCount > 0 else { return }
        let snapshot = notifications
        for i in notifications.indices { notifications[i].isRead = true }
        do {
            let _: MessageResponse = try await APIClient.shared.request(.markAllNotificationsRead)
            NotificationCenter.default.post(name: .notificationsChanged, object: nil)
        } catch {
            notifications = snapshot
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
    }

    func delete(_ notification: AppNotification) async {
        notifications.removeAll { $0.id == notification.id }
        let wasUnread = !notification.isRead
        do {
            let _: MessageResponse = try await APIClient.shared.request(.deleteNotification(id: notification.id))
            if wasUnread {
                NotificationCenter.default.post(name: .notificationsChanged, object: nil)
            }
        } catch {
            await load()
        }
    }
}
