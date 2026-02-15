import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from './api/client';

function ActivityFeed({ entityType, entityId, limit = 20 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId, limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      let url;
      if (entityType && entityId) {
        // Fetch activities for specific entity
        url = `/api/activities/entity/${entityType}/${entityId}?limit=${limit}`;
      } else {
        // Fetch recent activities
        url = `/api/activities/recent?limit=${limit}`;
      }

      const data = await apiClient.get(url);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      create: '➕',
      update: '✏️',
      delete: '🗑️',
      move: '📦',
      upload_image: '📷',
      delete_image: '🖼️'
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action) => {
    const colors = {
      create: '#10b981',
      update: '#3b82f6',
      delete: '#ef4444',
      move: '#8b5cf6',
      upload_image: '#06b6d4',
      delete_image: '#f59e0b'
    };
    return colors[action] || '#6b7280';
  };

  const getActionText = (activity) => {
    const { action, entityType, entityName, user, changes } = activity;
    const userName = user?.username || 'System';
    const entity = entityName || `${entityType} #${activity.entityId || '?'}`;

    switch (action) {
      case 'create':
        return (
          <>
            <strong>{userName}</strong> created {entityType} <strong>{entity}</strong>
          </>
        );
      case 'update':
        return (
          <>
            <strong>{userName}</strong> updated {entityType} <strong>{entity}</strong>
            {changes?.fields && ` (${changes.fields.join(', ')})`}
          </>
        );
      case 'delete':
        return (
          <>
            <strong>{userName}</strong> deleted {entityType} <strong>{entity}</strong>
          </>
        );
      case 'move':
        return (
          <>
            <strong>{userName}</strong> moved {entityType} <strong>{entity}</strong>
          </>
        );
      case 'upload_image':
        return (
          <>
            <strong>{userName}</strong> uploaded {changes?.imagesAdded?.length || 1} image(s) to <strong>{entity}</strong>
          </>
        );
      case 'delete_image':
        return (
          <>
            <strong>{userName}</strong> deleted an image from <strong>{entity}</strong>
          </>
        );
      default:
        return (
          <>
            <strong>{userName}</strong> performed {action} on {entityType} <strong>{entity}</strong>
          </>
        );
    }
  };

  const getEntityLink = (activity) => {
    const { entityType, entityId } = activity;
    if (!entityId) return null;

    switch (entityType) {
      case 'item':
        return `/item/${entityId}`;
      case 'box':
        return `/box/${entityId}`;
      case 'location':
        return `/location/${entityId}`;
      default:
        return null;
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  };

  if (loading) {
    return <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading activity history...</p>;
  }

  if (error) {
    return <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>;
  }

  if (activities.length === 0) {
    return <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No activity recorded yet.</p>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
        {entityType && entityId ? 'Item History' : 'Recent Activity'}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.map((activity) => {
          const link = getEntityLink(activity);
          return (
            <div
              key={activity.id}
              style={{
                padding: '12px 15px',
                backgroundColor: '#f9fafb',
                borderLeft: `4px solid ${getActionColor(activity.action)}`,
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>{getActionIcon(activity.action)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#374151', lineHeight: '1.5' }}>
                    {link && activity.entityId ? (
                      <Link to={link} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        {getActionText(activity)}
                      </Link>
                    ) : (
                      getActionText(activity)
                    )}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '4px' }}>
                    {formatTimeAgo(activity.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityFeed;
