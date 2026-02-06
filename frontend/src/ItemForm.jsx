import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

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

  const fetchLocations = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiClient.get('/api/locations');
      setLocations(data);
    } catch (err) {
      setError('Error fetching locations');
    }
  };

  const fetchBoxes = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiClient.get('/api/boxes');
      setBoxes(data);
    } catch (err) {
      setError('Error fetching boxes');
    }
  };

  const fetchItem = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiClient.get(`/api/items/${id}`);
      setFormData({
        name: data.name,
        category: data.category || '',
        boxId: data.boxId ? data.boxId.toString() : ''
      });

      if (data.Box && data.Box.locationId) {
        setSelectedLocationId(data.Box.locationId.toString());
      }
    } catch (err) {
      setError(err.message || "Error connecting to server");
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

    const submitData = {
      name: formData.name,
      category: formData.category,
      boxId: formData.boxId ? parseInt(formData.boxId) : null
    };

    try {
      if (isEditing) {
        await apiClient.put(`/api/items/${id}`, submitData);
      } else {
        await apiClient.post('/api/items/', submitData);
      }
      navigate('/');
    } catch (error) {
      console.error("Error saving item:", error);
      setError(error.message || "Failed to save item");
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
