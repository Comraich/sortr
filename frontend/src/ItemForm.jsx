import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [error, setError] = useState(null);
  
  const initialFormState = {
    name: '',
    category: '',
    location: '',
    boxNumber: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isEditing) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await fetch(`${API_URL}/api/items/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          category: data.category || '',
          location: data.location || '',
          boxNumber: data.boxNumber || ''
        });
      } else {
        setError("Failed to fetch item details");
      }
    } catch (err) {
      setError("Error connecting to server");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/api/items/${id}` : `${API_URL}/api/items/`;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/');
      } else {
        setError(data.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error saving item:", error);
      setError("Failed to connect to server");
    }
  };

  return (
    <section className="card form-section">
      <h2>{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Storage Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Box Number</label>
            <input
              type="text"
              name="boxNumber"
              value={formData.boxNumber}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Update Item' : 'Add to Inventory'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-secondary">
            Cancel
          </button>
        </div>

        {isEditing && (
          <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Item QR Code</h3>
            <div style={{ background: 'white', padding: '10px', display: 'inline-block', border: '1px solid #ddd', borderRadius: '8px' }}>
              <QRCodeSVG value={JSON.stringify({ id, name: formData.name, box: formData.boxNumber, loc: formData.location })} size={128} />
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
              Scan to identify item
            </p>
          </div>
        )}
      </form>
    </section>
  );
}

export default ItemForm;