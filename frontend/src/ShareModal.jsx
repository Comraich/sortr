import { useState, useEffect } from 'react';
import { apiClient } from './api/client';

function ShareModal({ resourceType, resourceId, resourceName, onClose }) {
  const [users, setUsers] = useState([]);
  const [shares, setShares] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [resourceType, resourceId]);

  const fetchData = async () => {
    try {
      const [usersData, sharesData] = await Promise.all([
        apiClient.get('/api/users'),
        apiClient.get(`/api/shares/resource/${resourceType}/${resourceId}`)
      ]);
      setUsers(usersData);
      setShares(sharesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await apiClient.post('/api/shares', {
        userId: parseInt(selectedUser),
        resourceType,
        resourceId,
        permission
      });
      setSelectedUser('');
      setPermission('view');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteShare = async (shareId) => {
    if (!window.confirm('Remove this share?')) return;

    try {
      await apiClient.delete(`/api/shares/${shareId}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const availableUsers = users.filter(
    user => !shares.some(share => share.userId === user.id)
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Share "{resourceName}"</h3>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Add new share */}
            <form onSubmit={handleShare} style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>Share with user:</label>
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  required
                >
                  <option value="">-- Select User --</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Permission:</label>
                <select
                  value={permission}
                  onChange={e => setPermission(e.target.value)}
                >
                  <option value="view">View only</option>
                  <option value="edit">Can edit</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={!selectedUser}
              >
                Share
              </button>
            </form>

            {/* Current shares */}
            {shares.length > 0 && (
              <>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                  Currently shared with:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shares.map(share => (
                    <div
                      key={share.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {share.user?.displayName || share.user?.username}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          {share.permission === 'view' ? 'View only' : 'Can edit'} •
                          Shared by {share.sharedBy?.displayName || share.sharedBy?.username}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteShare(share.id)}
                        className="btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {shares.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                Not shared with anyone yet.
              </p>
            )}
          </>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
