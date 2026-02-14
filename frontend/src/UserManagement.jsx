import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    isAdmin: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.get('/api/users');
      setUsers(data);
    } catch (err) {
      if (err.message.includes('Admin access required')) {
        setError('You do not have permission to access user management. Admin access is required.');
      } else {
        setError(err.message || 'Error fetching users');
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      displayName: '',
      password: '',
      isAdmin: false
    });
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      displayName: user.displayName || '',
      password: '', // Don't pre-fill password
      isAdmin: user.isAdmin
    });
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      displayName: '',
      password: '',
      isAdmin: false
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!editingUser && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        displayName: formData.displayName.trim() || undefined,
        isAdmin: formData.isAdmin
      };

      // Only include password if it's set
      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUser) {
        await apiClient.put(`/api/users/${editingUser.id}`, payload);
      } else {
        await apiClient.post('/api/users', payload);
      }

      closeModal();
      fetchUsers();
    } catch (err) {
      setError(err.message || `Error ${editingUser ? 'updating' : 'creating'} user`);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    setError(null);

    try {
      await apiClient.delete(`/api/users/${user.id}`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Error deleting user');
    }
  };

  const getAuthType = (user) => {
    if (user.googleId) return 'Google';
    if (user.githubId) return 'GitHub';
    if (user.microsoftId) return 'Microsoft';
    return 'Local';
  };

  const getAuthBadgeColor = (authType) => {
    switch (authType) {
      case 'Google': return '#4285f4';
      case 'GitHub': return '#333';
      case 'Microsoft': return '#00a4ef';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <section className="card">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Loading users...</p>
        </div>
      </section>
    );
  }

  if (error && !showModal) {
    return (
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <Link to="/settings" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
              Settings
            </Link>
            <span style={{ color: '#6b7280', margin: '0 8px' }}>/</span>
            <h2 style={{ margin: 0, display: 'inline' }}>User Management</h2>
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 15px' }}>
            Back to Settings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <Link to="/settings" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
            Settings
          </Link>
          <span style={{ color: '#6b7280', margin: '0 8px' }}>/</span>
          <h2 style={{ margin: 0, display: 'inline' }}>User Management</h2>
        </div>
        <button onClick={openAddModal} className="btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
          Add User
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No users found.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Display Name</th>
              <th>Auth Type</th>
              <th>Role</th>
              <th style={{ width: '180px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const authType = getAuthType(user);
              return (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td style={{ color: user.email ? 'inherit' : '#9ca3af' }}>
                    {user.email || '—'}
                  </td>
                  <td style={{ color: user.displayName ? 'inherit' : '#9ca3af' }}>
                    {user.displayName || '—'}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      borderRadius: '4px',
                      backgroundColor: getAuthBadgeColor(authType),
                      color: 'white'
                    }}>
                      {authType}
                    </span>
                  </td>
                  <td>
                    {user.isAdmin && (
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: '4px',
                        backgroundColor: '#10b981',
                        color: 'white'
                      }}>
                        Admin
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => openEditModal(user)} className="btn-small">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(user)} className="btn-small btn-danger">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 15px' }}>
          Back to Settings
        </Link>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>

            {error && (
              <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '15px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%' }}
                  required={!editingUser}
                />
                {!editingUser && (
                  <small style={{ color: '#6b7280' }}>Minimum 6 characters</small>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontWeight: '500' }}>Admin</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default UserManagement;
