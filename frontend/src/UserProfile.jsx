import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated, getCurrentUser } from './api/client';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.get('/api/profile');
      setUser(data);
      setFormData({
        username: data.username || '',
        email: data.email || '',
        displayName: data.displayName || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate passwords if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Current password is required to set a new password');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
    }

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        displayName: formData.displayName.trim() || undefined
      };

      // Only include password fields if changing password
      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      await apiClient.put('/api/profile', payload);
      setSuccess(true);

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Refresh profile data
      fetchUserProfile();
    } catch (err) {
      setError(err.message || 'Error updating profile');
    }
  };

  if (loading) {
    return (
      <section className="card">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>My Profile</h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Update your account information and password.
      </p>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '10px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '4px', marginBottom: '15px' }}>
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            style={{ width: '100%' }}
            required
            minLength={3}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
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

        <div style={{ marginBottom: '20px' }}>
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

        {user?.isAdmin && (
          <div style={{ padding: '10px', backgroundColor: '#dbeafe', borderRadius: '4px', marginBottom: '20px' }}>
            <strong>Admin User</strong>
          </div>
        )}

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <h3 style={{ marginBottom: '15px' }}>Change Password</h3>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '15px' }}>
          Leave blank to keep your current password.
        </p>

        {!user?.googleId && !user?.githubId && !user?.microsoftId ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Current Password
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                New Password
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                style={{ width: '100%' }}
                minLength={6}
              />
              <small style={{ color: '#6b7280' }}>Minimum 6 characters</small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </>
        ) : (
          <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              You're using OAuth authentication ({user.googleId ? 'Google' : user.githubId ? 'GitHub' : 'Microsoft'}).
              Password changes are not available for OAuth accounts.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button type="submit" className="btn-primary">
            Save Changes
          </button>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 15px' }}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

export default UserProfile;
