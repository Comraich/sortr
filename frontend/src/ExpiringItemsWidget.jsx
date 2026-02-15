import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from './api/client';

function ExpiringItemsWidget() {
  const [expiredItems, setExpiredItems] = useState([]);
  const [expiringSoonItems, setExpiringSoonItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('expiring'); // 'expiring' or 'expired'

  useEffect(() => {
    fetchExpiringItems();
  }, []);

  const fetchExpiringItems = async () => {
    try {
      const [expiredData, expiringSoonData] = await Promise.all([
        apiClient.get('/api/expiration/expired'),
        apiClient.get('/api/expiration/expiring-soon?days=7')
      ]);
      setExpiredItems(expiredData);
      setExpiringSoonItems(expiringSoonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiration = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationColor = (days) => {
    if (days < 0) return '#ef4444'; // Expired - red
    if (days === 0) return '#f97316'; // Today - orange
    if (days <= 3) return '#f59e0b'; // 1-3 days - amber
    return '#10b981'; // 4+ days - green
  };

  const formatExpirationStatus = (days) => {
    if (days < 0) return `Expired ${Math.abs(days)} day(s) ago`;
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} day(s)`;
  };

  const items = activeTab === 'expiring' ? expiringSoonItems : expiredItems;

  if (loading) {
    return (
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>⏰ Expiration Tracking</h3>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>⏰ Expiration Tracking</h3>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>⏰ Expiration Tracking</h3>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('expiring')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'expiring' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'expiring' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'expiring' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Expiring Soon ({expiringSoonItems.length})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'expired' ? '2px solid #ef4444' : '2px solid transparent',
            color: activeTab === 'expired' ? '#ef4444' : '#6b7280',
            fontWeight: activeTab === 'expired' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Expired ({expiredItems.length})
        </button>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
          {activeTab === 'expiring' ? 'No items expiring in the next 7 days' : 'No expired items'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item) => {
            const days = getDaysUntilExpiration(item.expirationDate);
            const color = getExpirationColor(days);

            return (
              <Link
                key={item.id}
                to={`/item/${item.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #e5e7eb',
                  borderLeft: `4px solid ${color}`
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '2px' }}>
                    {item.isFavorite && <span style={{ marginRight: '4px' }}>⭐</span>}
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {item.category || 'Uncategorized'} •{' '}
                    {item.Box?.Location?.name || item.Location?.name || 'No location'}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color, fontWeight: '500', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  {formatExpirationStatus(days)}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {items.length > 5 && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Link
            to="/items"
            style={{
              fontSize: '0.85rem',
              color: '#3b82f6',
              textDecoration: 'none'
            }}
          >
            View all items →
          </Link>
        </div>
      )}
    </div>
  );
}

export default ExpiringItemsWidget;
