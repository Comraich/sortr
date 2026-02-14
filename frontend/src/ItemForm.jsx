import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

function ItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;
  const preselectedBoxId = searchParams.get('boxId');
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredBoxes, setFilteredBoxes] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');

  const initialFormState = {
    name: '',
    category: '',
    locationId: '',
    boxId: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchLocations();
    fetchBoxes();
    fetchCategories();
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

  // Handle preselected box from URL parameter
  useEffect(() => {
    if (preselectedBoxId && boxes.length > 0 && !isEditing) {
      const box = boxes.find(b => b.id === parseInt(preselectedBoxId));
      if (box) {
        setFormData(prev => ({ ...prev, boxId: preselectedBoxId }));
        setSelectedLocationId(box.locationId.toString());
      }
    }
  }, [preselectedBoxId, boxes, isEditing]);

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

  const fetchCategories = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiClient.get('/api/categories');
      setCategories(data);
    } catch (err) {
      setError('Error fetching categories');
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
        locationId: data.locationId ? data.locationId.toString() : '',
        boxId: data.boxId ? data.boxId.toString() : ''
      });

      // Set selected location from either direct location or box's location
      if (data.locationId) {
        setSelectedLocationId(data.locationId.toString());
      } else if (data.Box && data.Box.locationId) {
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
    setFormData({ ...formData, locationId: locationId, boxId: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // If a box is selected, location comes from the box
    // If no box but location selected, use the direct location
    const submitData = {
      name: formData.name,
      category: formData.category,
      locationId: formData.boxId ? null : (formData.locationId ? parseInt(formData.locationId) : null),
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
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="">-- Select Category --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
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
            <label>Box (Optional)</label>
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
