import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FilterBar from './FilterBar';
import { apiClient, isAuthenticated } from './api/client';

function ItemList() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [locations, setLocations] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocationsAndBoxes();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `/api/items/${queryString ? '?' + queryString : ''}`;

      const data = await apiClient.get(url);
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const fetchLocationsAndBoxes = async () => {
    try {
      const [locData, boxData] = await Promise.all([
        apiClient.get('/api/locations'),
        apiClient.get('/api/boxes')
      ]);
      setLocations(locData);
      setBoxes(boxData);
    } catch (error) {
      console.error("Error fetching locations/boxes:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiClient.get('/api/categories');
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await apiClient.delete(`/api/items/${id}`);
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Bulk selection handlers
  const toggleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(items.map(item => item.id));
    setSelectedItems(allIds);
  };

  const selectNone = () => {
    setSelectedItems(new Set());
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} items? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedItems).map(id => apiClient.delete(`/api/items/${id}`))
      );
      setSelectedItems(new Set());
      fetchItems();
      alert(`Successfully deleted ${selectedItems.size} items`);
    } catch (error) {
      console.error("Error deleting items:", error);
      alert('Failed to delete some items. Please try again.');
    }
  };

  const handleBulkMove = async () => {
    if (selectedItems.size === 0) return;

    const boxId = prompt(`Enter box ID to move ${selectedItems.size} items to (or leave empty for no box):`);
    if (boxId === null) return; // User cancelled

    const locationId = prompt(`Enter location ID (optional):`);

    try {
      await Promise.all(
        Array.from(selectedItems).map(id =>
          apiClient.put(`/api/items/${id}`, {
            boxId: boxId ? parseInt(boxId) : null,
            locationId: locationId ? parseInt(locationId) : undefined
          })
        )
      );
      setSelectedItems(new Set());
      fetchItems();
      alert(`Successfully moved ${selectedItems.size} items`);
    } catch (error) {
      console.error("Error moving items:", error);
      alert('Failed to move some items. Please try again.');
    }
  };

  const handleBulkCategorize = async () => {
    if (selectedItems.size === 0) return;

    const category = prompt(`Enter category for ${selectedItems.size} items:`);
    if (!category) return;

    try {
      await Promise.all(
        Array.from(selectedItems).map(id =>
          apiClient.put(`/api/items/${id}`, { category })
        )
      );
      setSelectedItems(new Set());
      fetchItems();
      alert(`Successfully categorized ${selectedItems.size} items`);
    } catch (error) {
      console.error("Error categorizing items:", error);
      alert('Failed to categorize some items. Please try again.');
    }
  };

  const selectedCount = selectedItems.size;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return (
    <section className="card list-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Current Stock</h2>
        <Link to="/add" className="btn-primary" style={{ width: 'auto', textDecoration: 'none', display: 'inline-block' }}>
          Add New Item
        </Link>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <Link to="/" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
          &larr; Back to Locations
        </Link>
      </div>

      {/* Advanced Filters */}
      <FilterBar
        onFilterChange={handleFilterChange}
        locations={locations}
        boxes={boxes}
        categories={categories}
      />

      {/* Bulk Actions Toolbar */}
      {selectedCount > 0 && (
        <div style={{
          marginBottom: '15px',
          padding: '12px 15px',
          backgroundColor: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: '500', color: '#1e40af' }}>
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBulkMove}
              className="btn-small"
              style={{ fontSize: '0.85rem' }}
            >
              Move
            </button>
            <button
              onClick={handleBulkCategorize}
              className="btn-small"
              style={{ fontSize: '0.85rem' }}
            >
              Categorize
            </button>
            <button
              onClick={handleBulkDelete}
              className="btn-danger"
              style={{ fontSize: '0.85rem' }}
            >
              Delete {selectedCount}
            </button>
            <button
              onClick={selectNone}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading items...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <>
          {/* Selection Controls */}
          <div style={{ marginBottom: '10px', fontSize: '0.9rem' }}>
            <button
              onClick={selectAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginRight: '15px'
              }}
            >
              Select All
            </button>
            {selectedCount > 0 && (
              <button
                onClick={selectNone}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Select None
              </button>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={allSelected ? selectNone : selectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>Name</th>
                <th>Category</th>
                <th>Tags</th>
                <th>Location</th>
                <th>Box #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ backgroundColor: selectedItems.has(item.id) ? '#eff6ff' : 'transparent' }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    {item.isFavorite && <span style={{ marginRight: '6px', color: '#fbbf24' }}>⭐</span>}
                    {item.name}
                  </td>
                  <td>{item.category || '-'}</td>
                  <td>
                    {item.tags && item.tags.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #3b82f6',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              color: '#1e40af'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{item.Box?.Location?.name || item.Location?.name || '-'}</td>
                  <td>{item.Box?.name || '-'}</td>
                  <td>
                    <button
                      className="btn-small"
                      onClick={() => navigate(`/edit/${item.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

export default ItemList;
