import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';
import RecentlyViewed from './RecentlyViewed';

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
    return items.filter(item =>
      item.locationId === locationId || locationBoxIds.includes(item.boxId)
    ).length;
  };

  const totalBoxes = boxes.length;
  const totalItems = items.length;

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

  const hierarchicalLocations = buildHierarchy(locations);

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
          <Link to="/scan" className="btn-primary" style={{ textDecoration: 'none', width: 'auto', padding: '8px 16px' }}>
            📷 Scan QR
          </Link>
          <Link to="/print" className="btn-small" style={{ textDecoration: 'none', width: 'auto' }}>
            Print QR Codes
          </Link>
          <Link to="/items" className="btn-small" style={{ textDecoration: 'none', width: 'auto' }}>
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

      {/* Recently Viewed Items */}
      <RecentlyViewed />

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
            {hierarchicalLocations.map((location) => (
              <tr key={location.id}>
                <td>
                  <div style={{ marginLeft: `${location.depth * 20}px`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {location.depth > 0 && <span style={{ color: '#9ca3af' }}>└─</span>}
                    <Link to={`/location/${location.id}`} style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '500' }}>
                      {location.name}
                    </Link>
                  </div>
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
