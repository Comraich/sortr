import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiClient, isAuthenticated } from './api/client';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get('/api/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
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
      minute: 60
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
    return (
      <section className="card">
        <h2>Dashboard</h2>
        <p>Loading statistics...</p>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section className="card">
        <h2>Dashboard</h2>
        <div className="error-message">{error || 'Failed to load dashboard'}</div>
      </section>
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📊 Dashboard</h2>
        <p style={{ color: '#6b7280', margin: '10px 0 0 0' }}>Overview of your inventory</p>
      </section>

      {/* Quick Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.overview.totalItems}</div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Items</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.overview.totalBoxes}</div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Boxes</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.overview.totalLocations}</div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Locations</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.overview.totalCategories}</div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Categories</div>
        </div>
      </div>

      {/* Storage Utilization */}
      <section className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>📦 Storage Utilization</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '5px' }}>Box Utilization</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.overview.boxUtilization}%</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '5px' }}>Avg Items per Box</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>{stats.overview.averageItemsPerBox}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '5px' }}>Empty Boxes</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.overview.emptyBoxesCount}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '5px' }}>Items Without Box</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.overview.itemsWithoutBox}</div>
          </div>
        </div>
      </section>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Items by Category */}
        {stats.itemsByCategory.length > 0 && (
          <section className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>📂 Items by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.itemsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Items by Location */}
        {stats.itemsByLocation.length > 0 && (
          <section className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>📍 Items by Location</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.itemsByLocation}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.count}`}
                >
                  {stats.itemsByLocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
        )}
      </div>

      {/* Top Boxes and Recent Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Top Boxes */}
        {stats.topBoxes.length > 0 && (
          <section className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>📦 Most Filled Boxes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.topBoxes.slice(0, 5).map((box, index) => (
                <Link
                  key={box.id}
                  to={`/box/${box.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{box.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{box.location}</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: COLORS[index % COLORS.length] }}>
                    {box.count}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently Added Items */}
        {stats.recentItems.length > 0 && (
          <section className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>🕐 Recently Added Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentItems.slice(0, 5).map((item) => (
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
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {item.category || 'Uncategorized'} • {item.location}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>
                    {formatTimeAgo(item.createdAt)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Empty Boxes and Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Empty Boxes */}
        {stats.emptyBoxes.length > 0 && (
          <section className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>📭 Empty Boxes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.emptyBoxes.slice(0, 5).map((box) => (
                <Link
                  key={box.id}
                  to={`/box/${box.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid #fecaca'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{box.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{box.location}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#ef4444' }}>Empty</div>
                </Link>
              ))}
            </div>
            {stats.emptyBoxes.length > 5 && (
              <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#6b7280', textAlign: 'center' }}>
                +{stats.emptyBoxes.length - 5} more empty boxes
              </div>
            )}
          </section>
        )}

        {/* Recent Activity */}
        {stats.recentActivity.length > 0 && (
          <section className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>📝 Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>{activity.user}</strong> {activity.action} {activity.entityType}{' '}
                    <strong>{activity.entityName || `#${activity.entityId}`}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                    {formatTimeAgo(activity.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
