import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, isAuthenticated } from './api/client';

function ItemList() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [locations, setLocations] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
    fetchLocationsAndBoxes();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get('/api/items/');
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
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
    const allIds = new Set(filteredItems.map(item => item.id));
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

  // Filter items based on search query
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(query);
    const matchesCategory = item.category?.toLowerCase().includes(query);
    const matchesLocation = (item.Box?.Location?.name || item.Location?.name)?.toLowerCase().includes(query);
    const matchesBox = item.Box?.name?.toLowerCase().includes(query);

    return matchesName || matchesCategory || matchesLocation || matchesBox;
  });

  const selectedCount = selectedItems.size;
  const allSelected = filteredItems.length > 0 && selectedCount === filteredItems.length;

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

      {/* Search bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search items by name, category, location, or box..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 15px',
            fontSize: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        />
        {searchQuery && (
          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
            Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

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
      ) : filteredItems.length === 0 ? (
        <p>{searchQuery ? 'No items match your search.' : 'No items in storage.'}</p>
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
                <th>Location</th>
                <th>Box #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={{ backgroundColor: selectedItems.has(item.id) ? '#eff6ff' : 'transparent' }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.category || '-'}</td>
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
