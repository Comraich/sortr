import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const fetchCategories = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/categories`, { headers });
      if (response.status === 401 || response.status === 403) return navigate('/login');

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError('Error fetching categories');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newCategoryName.trim() })
      });

      if (response.ok) {
        setNewCategoryName('');
        fetchCategories();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create category');
      }
    } catch (err) {
      setError('Error creating category');
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: editingName.trim() })
      });

      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        fetchCategories();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update category');
      }
    } catch (err) {
      setError('Error updating category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete category');
      }
    } catch (err) {
      setError('Error deleting category');
    }
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setError(null);
  };

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <Link to="/settings" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
            Settings
          </Link>
          <span style={{ color: '#6b7280', margin: '0 8px' }}>/</span>
          <h2 style={{ margin: 0, display: 'inline' }}>Categories</h2>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {/* Add New Category Form */}
      <form onSubmit={handleCreate} style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary">Add Category</button>
        </div>
      </form>

      {/* Categories Table */}
      {categories.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No categories yet. Add your first category above.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Category Name</th>
              <th style={{ width: '200px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  {editingId === category.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{ width: '100%' }}
                      autoFocus
                    />
                  ) : (
                    category.name
                  )}
                </td>
                <td>
                  {editingId === category.id ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleUpdate(category.id)} className="btn-small">
                        Save
                      </button>
                      <button onClick={cancelEditing} className="btn-small btn-secondary">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => startEditing(category)} className="btn-small">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(category.id, category.name)} className="btn-small btn-danger">
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 15px' }}>
          Back to Settings
        </Link>
      </div>
    </section>
  );
}

export default CategoryList;
