import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [filteredBoxes, setFilteredBoxes] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');

  const initialFormState = {
    name: '',
    category: '',
    boxId: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchLocations();
    fetchBoxes();
  }, []);

  useEffect(() => {
    if (isEditing && boxes.length > 0) {
      fetchItem();
    }
  }, [id, boxes]);

  useEffect(() => {
    if (selectedLocationId) {
      setFilteredBoxes(boxes.filter(box => box.locationId === parseInt(selectedLocationId)));
    } else {
      setFilteredBoxes([]);
    }
  }, [selectedLocationId, boxes]);

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
          boxId: data.boxId ? data.boxId.toString() : ''
        });

        if (data.Box && data.Box.locationId) {
          setSelectedLocationId(data.Box.locationId.toString());
        }
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

  const handleLocationChange = (e) => {
    const locationId = e.target.value;
    setSelectedLocationId(locationId);
    setFormData({ ...formData, boxId: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/api/items/${id}` : `${API_URL}/api/items/`;

    const submitData = {
      name: formData.name,
      category: formData.category,
      boxId: formData.boxId ? parseInt(formData.boxId) : null
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData),
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
            <select
              value={selectedLocationId}
              onChange={handleLocationChange}
            >
              <option value="">Select location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Box</label>
            <select
              name="boxId"
              value={formData.boxId}
              onChange={handleInputChange}
              disabled={!selectedLocationId}
            >
              <option value="">{selectedLocationId ? 'Select box...' : 'Select location first'}</option>
              {filteredBoxes.map((box) => (
                <option key={box.id} value={box.id}>{box.name}</option>
              ))}
            </select>
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
      </form>
    </section>
  );
}

export default ItemForm;
