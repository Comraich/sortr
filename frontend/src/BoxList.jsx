import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function BoxList() {
  const [boxes, setBoxes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxLocationId, setNewBoxLocationId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingLocationId, setEditingLocationId] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
    fetchBoxes();
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

  const fetchBoxes = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/boxes`, { headers });
      if (response.status === 401 || response.status === 403) return navigate('/login');

      const data = await response.json();
      setBoxes(data);
    } catch (err) {
      setError('Error fetching boxes');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newBoxName.trim() || !newBoxLocationId) return;
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/boxes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newBoxName.trim(), locationId: parseInt(newBoxLocationId) })
      });

      if (response.ok) {
        setNewBoxName('');
        setNewBoxLocationId('');
        fetchBoxes();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create box');
      }
    } catch (err) {
      setError('Error creating box');
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim() || !editingLocationId) return;
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/boxes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: editingName.trim(), locationId: parseInt(editingLocationId) })
      });

      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        setEditingLocationId('');
        fetchBoxes();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update box');
      }
    } catch (err) {
      setError('Error updating box');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this box?')) return;
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/boxes/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        fetchBoxes();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete box');
      }
    } catch (err) {
      setError('Error deleting box');
    }
  };

  const startEditing = (box) => {
    setEditingId(box.id);
    setEditingName(box.name);
    setEditingLocationId(box.locationId.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingLocationId('');
  };

  return (
    <section className="card list-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Boxes</h2>
        <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', padding: '8px 12px' }}>
          Back to Settings
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={newBoxName}
          onChange={(e) => setNewBoxName(e.target.value)}
          placeholder="Box name"
          style={{ flex: '1 1 200px' }}
        />
        <select
          value={newBoxLocationId}
          onChange={(e) => setNewBoxLocationId(e.target.value)}
          style={{ flex: '1 1 150px' }}
        >
          <option value="">Select location...</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>
          Add Box
        </button>
      </form>

      {locations.length === 0 && (
        <p style={{ color: '#6b7280', marginBottom: '15px' }}>
          Create a <Link to="/locations">location</Link> first before adding boxes.
        </p>
      )}

      {boxes.length === 0 ? (
        <p>No boxes defined yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box) => (
              <tr key={box.id} className={editingId === box.id ? 'editing-row' : ''}>
                <td>
                  {editingId === box.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    box.name
                  )}
                </td>
                <td>
                  {editingId === box.id ? (
                    <select
                      value={editingLocationId}
                      onChange={(e) => setEditingLocationId(e.target.value)}
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  ) : (
                    box.Location?.name || '-'
                  )}
                </td>
                <td>
                  {editingId === box.id ? (
                    <>
                      <button className="btn-small" onClick={() => handleUpdate(box.id)}>
                        Save
                      </button>
                      <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={cancelEditing}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small" onClick={() => startEditing(box)}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(box.id)}>
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

export default BoxList;
