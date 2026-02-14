import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

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

  const fetchLocations = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiClient.get('/api/locations');
      setLocations(data);
    } catch (err) {
      setError(err.message || 'Error fetching locations');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    setError(null);

    try {
      await apiClient.post('/api/locations', { name: newLocation.trim() });
      setNewLocation('');
      fetchLocations();
    } catch (err) {
      setError(err.message || 'Error creating location');
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    setError(null);

    try {
      await apiClient.put(`/api/locations/${id}`, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
      fetchLocations();
    } catch (err) {
      setError(err.message || 'Error updating location');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    setError(null);

    try {
      await apiClient.delete(`/api/locations/${id}`);
      fetchLocations();
    } catch (err) {
      setError(err.message || 'Error deleting location');
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
