import { Link } from 'react-router-dom';

function Settings() {
  return (
    <section className="card">
      <h2>Settings</h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Manage your storage locations, boxes, and categories.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Link
          to="/locations"
          style={{
            display: 'block',
            padding: '15px 20px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#1f2937'
          }}
        >
          <strong>Locations</strong>
          <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
            Manage storage locations (e.g., Garage, Attic, Basement)
          </p>
        </Link>

        <Link
          to="/boxes"
          style={{
            display: 'block',
            padding: '15px 20px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#1f2937'
          }}
        >
          <strong>Boxes</strong>
          <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
            Manage boxes within your locations
          </p>
        </Link>

        <Link
          to="/categories"
          style={{
            display: 'block',
            padding: '15px 20px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#1f2937'
          }}
        >
          <strong>Categories</strong>
          <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
            Manage item categories for organization
          </p>
        </Link>
      </div>

      <div style={{ marginTop: '30px' }}>
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 15px' }}>
          Back to Inventory
        </Link>
      </div>
    </section>
  );
}

export default Settings;
