import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function LocationList() {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchLocations = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/locations`, { headers });
      if (response.status === 401 || response.status === 403) return navigate('/login');

      const data = await response.json();
      setLocations(data);
    } catch (err) {
      setError('Error fetching locations');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newLocation.trim() })
      });

      if (response.ok) {
        setNewLocation('');
        fetchLocations();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create location');
      }
    } catch (err) {
      setError('Error creating location');
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/locations/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: editingName.trim() })
      });

      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        fetchLocations();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update location');
      }
    } catch (err) {
      setError('Error updating location');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/locations/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        fetchLocations();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete location');
      }
    } catch (err) {
      setError('Error deleting location');
    }
  };

  const startEditing = (location) => {
    setEditingId(location.id);
    setEditingName(location.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <section className="card list-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Locations</h2>
        <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', padding: '8px 12px' }}>
          Back to Settings
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="New location name"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>
          Add Location
        </button>
      </form>

      {locations.length === 0 ? (
        <p>No locations defined yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id} className={editingId === location.id ? 'editing-row' : ''}>
                <td>
                  {editingId === location.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    location.name
                  )}
                </td>
                <td>
                  {editingId === location.id ? (
                    <>
                      <button className="btn-small" onClick={() => handleUpdate(location.id)}>
                        Save
                      </button>
                      <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={cancelEditing}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small" onClick={() => startEditing(location)}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(location.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default LocationList;
