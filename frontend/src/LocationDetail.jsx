import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const [locRes, boxRes, itemRes] = await Promise.all([
        fetch(`${API_URL}/api/locations`, { headers }),
        fetch(`${API_URL}/api/boxes`, { headers }),
        fetch(`${API_URL}/api/items/`, { headers })
      ]);

      if (locRes.status === 401 || boxRes.status === 401 || itemRes.status === 401) {
        return navigate('/login');
      }

      const [locData, boxData, itemData] = await Promise.all([
        locRes.json(),
        boxRes.json(),
        itemRes.json()
      ]);

      const foundLocation = locData.find(l => l.id === parseInt(id));
      if (!foundLocation) {
        setError('Location not found');
      } else {
        setLocation(foundLocation);
        setBoxes(boxData.filter(box => box.locationId === parseInt(id)));
        setItems(itemData);
      }
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const getItemCount = (boxId) => {
    return items.filter(item => item.boxId === boxId).length;
  };

  const totalItems = items.filter(item =>
    boxes.some(box => box.id === item.boxId)
  ).length;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/locations/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        navigate('/');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete location');
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Error deleting location');
    }
  };

  if (loading) {
    return (
      <section className="card">
        <p>Loading...</p>
      </section>
    );
  }

  if (error || !location) {
    return (
      <section className="card">
        <h2>Location Not Found</h2>
        <p>{error || 'The requested location could not be found.'}</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '10px 20px', textDecoration: 'none', marginTop: '15px' }}>
          Back to Locations
        </Link>
      </section>
    );
  }

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <Link to="/" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
            Locations
          </Link>
          <span style={{ color: '#6b7280', margin: '0 8px' }}>/</span>
          <h2 style={{ margin: 0, display: 'inline' }}>{location.name}</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '15px 20px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2563eb' }}>{boxes.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Boxes</div>
        </div>
        <div style={{ padding: '15px 20px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2563eb' }}>{totalItems}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Items</div>
        </div>
      </div>

      {boxes.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 15px 0' }}>No boxes in this location yet.</p>
          <Link to="/boxes" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '10px 20px' }}>
            Add Box
          </Link>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Box</th>
              <th style={{ textAlign: 'center' }}>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box) => (
              <tr key={box.id}>
                <td>
                  <Link to={`/box/${box.id}`} style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '500' }}>
                    {box.name}
                  </Link>
                </td>
                <td style={{ textAlign: 'center' }}>{getItemCount(box.id)}</td>
                <td>
                  <Link to={`/box/${box.id}`} className="btn-small" style={{ textDecoration: 'none' }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 15px' }}>
          Back to Locations
        </Link>
        {boxes.length === 0 && (
          <button
            onClick={handleDelete}
            className="btn-danger"
            style={{ padding: '10px 15px' }}
          >
            Delete Empty Location
          </button>
        )}
      </div>
    </section>
  );
}

export default LocationDetail;
