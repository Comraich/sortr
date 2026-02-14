import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

function LocationHome() {
  const [locations, setLocations] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

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

      setLocations(locData);
      setBoxes(boxData);
      setItems(itemData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBoxCount = (locationId) => {
    return boxes.filter(box => box.locationId === locationId).length;
  };

  const getItemCount = (locationId) => {
    const locationBoxIds = boxes
      .filter(box => box.locationId === locationId)
      .map(box => box.id);
    return items.filter(item => locationBoxIds.includes(item.boxId)).length;
  };

  const totalBoxes = boxes.length;
  const totalItems = items.length;

  if (loading) {
    return (
      <section className="card">
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Storage Locations</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/print" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 12px' }}>
            Print QR Codes
          </Link>
          <Link to="/items" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 12px' }}>
            View All Items
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '15px 20px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2563eb' }}>{locations.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Locations</div>
        </div>
        <div style={{ padding: '15px 20px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2563eb' }}>{totalBoxes}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Boxes</div>
        </div>
        <div style={{ padding: '15px 20px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2563eb' }}>{totalItems}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Items</div>
        </div>
      </div>

      {locations.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 15px 0' }}>No storage locations yet.</p>
          <Link to="/locations" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '10px 20px' }}>
            Add Location
          </Link>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Location</th>
              <th style={{ textAlign: 'center' }}>Boxes</th>
              <th style={{ textAlign: 'center' }}>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id}>
                <td>
                  <Link to={`/location/${location.id}`} style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '500' }}>
                    {location.name}
                  </Link>
                </td>
                <td style={{ textAlign: 'center' }}>{getBoxCount(location.id)}</td>
                <td style={{ textAlign: 'center' }}>{getItemCount(location.id)}</td>
                <td>
                  <Link to={`/location/${location.id}`} className="btn-small" style={{ textDecoration: 'none' }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default LocationHome;
