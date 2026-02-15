import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from './api/client';

function NotificationsDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const data = await apiClient.get('/api/notifications/unread/count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification) => {
    if (notification.resourceType === 'item' && notification.resourceId) {
      return `/item/${notification.resourceId}`;
    }
    if (notification.resourceType === 'location' && notification.resourceId) {
      return `/location/${notification.resourceId}`;
    }
    if (notification.resourceType === 'box' && notification.resourceId) {
      return `/box/${notification.resourceId}`;
    }
    return null;
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary"
        style={{
          position: 'relative',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              minWidth: '18px',
              textAlign: 'center'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '350px',
              maxHeight: '400px',
              overflow: 'auto',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000
            }}
          >
            <div
              style={{
                padding: '12px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Notifications</h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                No notifications
              </div>
            ) : (
              <div>
                {notifications.slice(0, 10).map((notification) => {
                  const link = getNotificationLink(notification);
                  const content = (
                    <div
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: notification.isRead ? 'transparent' : '#eff6ff',
                        cursor: link ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkAsRead(notification.id);
                        }
                        if (link) {
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                        {notification.message}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                  );

                  return link ? (
                    <Link
                      key={notification.id}
                      to={link}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationsDropdown;
