import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

function LocationList() {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingParentId, setEditingParentId] = useState('');
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
      const payload = { name: newLocation.trim() };
      if (newParentId) {
        payload.parentId = parseInt(newParentId);
      }
      await apiClient.post('/api/locations', payload);
      setNewLocation('');
      setNewParentId('');
      fetchLocations();
    } catch (err) {
      setError(err.message || 'Error creating location');
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    setError(null);

    try {
      const payload = { name: editingName.trim() };
      if (editingParentId !== undefined) {
        payload.parentId = editingParentId ? parseInt(editingParentId) : null;
      }
      await apiClient.put(`/api/locations/${id}`, payload);
      setEditingId(null);
      setEditingName('');
      setEditingParentId('');
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
    setEditingParentId(location.parentId || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingParentId('');
  };

  // Build hierarchy tree for display
  const buildHierarchy = (locations, parentId = null, depth = 0) => {
    const children = locations.filter(loc => loc.parentId === parentId);
    const result = [];

    children.forEach(child => {
      result.push({ ...child, depth });
      result.push(...buildHierarchy(locations, child.id, depth + 1));
    });

    return result;
  };

  // Get breadcrumb path for a location
  const getBreadcrumb = (locationId) => {
    const parts = [];
    let currentId = locationId;

    while (currentId) {
      const loc = locations.find(l => l.id === currentId);
      if (!loc) break;
      parts.unshift(loc.name);
      currentId = loc.parentId;
    }

    return parts.join(' > ');
  };

  // Get available parent options (excluding self and descendants to prevent cycles)
  const getAvailableParents = (excludeId = null) => {
    if (!excludeId) return locations;

    const descendants = new Set([excludeId]);
    const findDescendants = (id) => {
      locations.filter(loc => loc.parentId === id).forEach(child => {
        descendants.add(child.id);
        findDescendants(child.id);
      });
    };
    findDescendants(excludeId);

    return locations.filter(loc => !descendants.has(loc.id));
  };

  const hierarchicalLocations = buildHierarchy(locations);

  return (
    <section className="card list-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Locations</h2>
        <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', padding: '8px 12px' }}>
          Back to Settings
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="New location name"
            style={{ flex: 2 }}
          />
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">-- No Parent (Top Level) --</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {getBreadcrumb(loc.id)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>
            Add Location
          </button>
        </div>
      </form>

      {locations.length === 0 ? (
        <p>No locations defined yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name (Hierarchy)</th>
              <th>Parent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hierarchicalLocations.map((location) => (
              <tr key={location.id} className={editingId === location.id ? 'editing-row' : ''}>
                <td>
                  {editingId === location.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ marginLeft: `${location.depth * 20}px`, color: '#9ca3af' }}>
                        {location.depth > 0 && '└─ '}
                      </span>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={{ flex: 1 }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div style={{ marginLeft: `${location.depth * 20}px` }}>
                      {location.depth > 0 && <span style={{ color: '#9ca3af', marginRight: '6px' }}>└─</span>}
                      {location.name}
                    </div>
                  )}
                </td>
                <td>
                  {editingId === location.id ? (
                    <select
                      value={editingParentId}
                      onChange={(e) => setEditingParentId(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- No Parent --</option>
                      {getAvailableParents(location.id).map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {getBreadcrumb(loc.id)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    location.parent?.name || '-'
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
