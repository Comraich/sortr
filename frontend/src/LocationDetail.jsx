import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

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

  const fetchData = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const [locData, boxData, itemData] = await Promise.all([
        apiClient.get('/api/locations'),
        apiClient.get('/api/boxes'),
        apiClient.get('/api/items/')
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
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const getItemCount = (boxId) => {
    return items.filter(item => item.boxId === boxId).length;
  };

  // Items in boxes
  const itemsInBoxes = items.filter(item =>
    boxes.some(box => box.id === item.boxId)
  );

  // Items directly in this location (no box)
  const itemsInLocation = items.filter(item =>
    item.locationId === parseInt(id) && !item.boxId
  );

  const totalItems = itemsInBoxes.length + itemsInLocation.length;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/locations/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Error deleting location:', err);
      alert(err.message || 'Error deleting location');
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

      {/* Boxes in location */}
      <h3 style={{ marginBottom: '15px' }}>Boxes</h3>
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

      {/* Items directly in location (no box) */}
      {itemsInLocation.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>Items in Location (No Box)</h3>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {itemsInLocation.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/item/${item.id}`} style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '500' }}>
                      {item.name}
                    </Link>
                  </td>
                  <td>{item.category || '-'}</td>
                  <td>
                    <Link to={`/edit/${item.id}`} className="btn-small" style={{ textDecoration: 'none' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 15px' }}>
          Back to Locations
        </Link>
        {boxes.length === 0 && itemsInLocation.length === 0 && (
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
