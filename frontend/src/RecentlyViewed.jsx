import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from './api/client';

const MAX_RECENT_ITEMS = 5;

// Get recently viewed items from localStorage
const getRecentlyViewed = () => {
  try {
    const recent = localStorage.getItem('recentlyViewed');
    return recent ? JSON.parse(recent) : [];
  } catch (e) {
    console.error('Error reading recently viewed:', e);
    return [];
  }
};

// Add item to recently viewed
export const addToRecentlyViewed = (itemId) => {
  try {
    const recent = getRecentlyViewed();
    // Remove if already exists (to move to front)
    const filtered = recent.filter(id => id !== itemId);
    // Add to front
    const updated = [itemId, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving recently viewed:', e);
  }
};

function RecentlyViewed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentItems();
  }, []);

  const fetchRecentItems = async () => {
    try {
      const recentIds = getRecentlyViewed();
      if (recentIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch item details for each ID
      const itemPromises = recentIds.map(id =>
        apiClient.get(`/api/items/${id}`).catch(() => null)
      );
      const itemsData = await Promise.all(itemPromises);

      // Filter out nulls (deleted items) and maintain order
      const validItems = itemsData.filter(item => item !== null);
      setItems(validItems);
    } catch (error) {
      console.error('Error fetching recent items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#6b7280' }}>
        🕒 Recently Viewed
      </h3>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
        {items.map(item => (
          <Link
            key={item.id}
            to={`/item/${item.id}`}
            style={{
              minWidth: '150px',
              padding: '10px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '4px' }}>
              {item.isFavorite && <span style={{ marginRight: '4px' }}>⭐</span>}
              {item.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {item.category || 'Uncategorized'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
              {item.Box?.Location?.name || item.Location?.name || 'No location'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RecentlyViewed;
