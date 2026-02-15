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

  // Smart suggestions state
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  const [boxSuggestions, setBoxSuggestions] = useState([]);
  const [emptyBoxes, setEmptyBoxes] = useState([]);

  const initialFormState = {
    name: '',
    category: '',
    description: '',
    expirationDate: '',
    locationId: '',
    boxId: '',
    tags: [],
    isFavorite: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [tagInput, setTagInput] = useState('');

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

  // Fetch suggestions when item name changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name && !isEditing) {
        fetchCategorySuggestions(formData.name);
        checkDuplicates(formData.name);
      }
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [formData.name, isEditing]);

  // Fetch box suggestions when category or location changes
  useEffect(() => {
    if (formData.category) {
      fetchBoxSuggestions(formData.category, selectedLocationId);
    }
  }, [formData.category, selectedLocationId]);

  // Fetch empty boxes when location changes
  useEffect(() => {
    if (selectedLocationId) {
      fetchEmptyBoxes(selectedLocationId);
    }
  }, [selectedLocationId]);

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

  // Fetch category suggestions based on item name
  const fetchCategorySuggestions = async (name) => {
    if (!name || name.length < 3) {
      setCategorySuggestions([]);
      return;
    }

    try {
      const data = await apiClient.get(`/api/suggestions/category?name=${encodeURIComponent(name)}`);
      setCategorySuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error fetching category suggestions:', err);
    }
  };

  // Check for duplicate items
  const checkDuplicates = async (name) => {
    if (!name || name.length < 3) {
      setDuplicateWarnings([]);
      return;
    }

    try {
      const excludeParam = id ? `&excludeId=${id}` : '';
      const data = await apiClient.get(`/api/suggestions/duplicates?name=${encodeURIComponent(name)}${excludeParam}`);
      setDuplicateWarnings(data.duplicates || []);
    } catch (err) {
      console.error('Error checking duplicates:', err);
    }
  };

  // Fetch box suggestions based on category and location
  const fetchBoxSuggestions = async (category, locationId) => {
    if (!category) {
      setBoxSuggestions([]);
      return;
    }

    try {
      const locationParam = locationId ? `&locationId=${locationId}` : '';
      const data = await apiClient.get(`/api/suggestions/box-for-item?category=${encodeURIComponent(category)}${locationParam}`);
      setBoxSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error fetching box suggestions:', err);
    }
  };

  // Fetch empty boxes in selected location
  const fetchEmptyBoxes = async (locationId) => {
    if (!locationId) {
      setEmptyBoxes([]);
      return;
    }

    try {
      const data = await apiClient.get(`/api/suggestions/empty-boxes?locationId=${locationId}`);
      setEmptyBoxes(data.emptyBoxes || []);
    } catch (err) {
      console.error('Error fetching empty boxes:', err);
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
        description: data.description || '',
        expirationDate: data.expirationDate || '',
        locationId: data.locationId ? data.locationId.toString() : '',
        boxId: data.boxId ? data.boxId.toString() : '',
        tags: data.tags || [],
        isFavorite: data.isFavorite || false
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

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData({ ...formData, tags: [...formData.tags, newTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const toggleFavorite = () => {
    setFormData({ ...formData, isFavorite: !formData.isFavorite });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Build submit data conditionally
    const submitData = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      expirationDate: formData.expirationDate || null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      isFavorite: formData.isFavorite
    };

    // If a box is selected, only send boxId
    if (formData.boxId) {
      submitData.boxId = parseInt(formData.boxId);
    }
    // If no box but location selected, send locationId
    else if (formData.locationId) {
      submitData.locationId = parseInt(formData.locationId);
    }

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

          {/* Duplicate Warnings */}
          {duplicateWarnings.length > 0 && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '5px' }}>
                ⚠️ Potential duplicates found:
              </div>
              {duplicateWarnings.map(dup => (
                <div key={dup.id} style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: '4px' }}>
                  • <a href={`/item/${dup.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#991b1b', textDecoration: 'underline' }}>
                    {dup.name}
                  </a> ({dup.similarity} match) - {dup.location}
                </div>
              ))}
            </div>
          )}
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

          {/* Category Suggestions */}
          {!formData.category && categorySuggestions.length > 0 && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: '5px' }}>
                💡 Suggested categories:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categorySuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: sug.category })}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.85rem',
                      backgroundColor: 'white',
                      border: '1px solid #3b82f6',
                      borderRadius: '12px',
                      color: '#3b82f6',
                      cursor: 'pointer'
                    }}
                    title={sug.reason}
                  >
                    {sug.category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Expiration Date */}
        <div className="form-group">
          <label>Expiration Date (Optional)</label>
          <input
            type="date"
            name="expirationDate"
            value={formData.expirationDate}
            onChange={handleInputChange}
          />
          {formData.expirationDate && (
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
              {new Date(formData.expirationDate) < new Date() ? (
                <span style={{ color: '#ef4444', fontWeight: '500' }}>⚠️ This item has expired</span>
              ) : (
                <span>
                  Expires in {Math.ceil((new Date(formData.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))} day(s)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tags Input */}
        <div className="form-group">
          <label>Tags</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type a tag and press Enter"
          />
          {formData.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #3b82f6',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    color: '#1e40af'
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1e40af',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '1rem',
                      lineHeight: '1',
                      fontWeight: 'bold'
                    }}
                    title="Remove tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Toggle */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.isFavorite}
              onChange={toggleFavorite}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <span>Mark as Favorite ⭐</span>
          </label>
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

        {/* Box Suggestions */}
        {formData.category && boxSuggestions.length > 0 && !formData.boxId && (
          <div style={{ marginTop: '10px', marginBottom: '15px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.85rem', color: '#065f46', marginBottom: '8px' }}>
              💡 Suggested boxes for {formData.category} items:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {boxSuggestions.map((sug) => (
                <button
                  key={sug.boxId}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, boxId: sug.boxId.toString() });
                    const box = boxes.find(b => b.id === sug.boxId);
                    if (box) {
                      setSelectedLocationId(box.locationId.toString());
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    backgroundColor: 'white',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    color: '#065f46',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <strong>{sug.boxName}</strong> - {sug.location} ({sug.reason})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty Boxes */}
        {selectedLocationId && emptyBoxes.length > 0 && !formData.boxId && (
          <div style={{ marginTop: '10px', marginBottom: '15px', padding: '10px', backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.85rem', color: '#713f12', marginBottom: '8px' }}>
              📦 Empty boxes in this location:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {emptyBoxes.slice(0, 5).map((box) => (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, boxId: box.id.toString() })}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.85rem',
                    backgroundColor: 'white',
                    border: '1px solid #eab308',
                    borderRadius: '12px',
                    color: '#713f12',
                    cursor: 'pointer'
                  }}
                >
                  {box.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
