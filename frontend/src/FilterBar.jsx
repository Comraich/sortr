import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function FilterBar({ onFilterChange, locations, boxes, categories }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    locationId: searchParams.get('locationId') || '',
    boxId: searchParams.get('boxId') || '',
    category: searchParams.get('category') || '',
    hasBox: searchParams.get('hasBox') || '',
    hasLocation: searchParams.get('hasLocation') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params[key] = filters[key];
      }
    });
    setSearchParams(params);
    onFilterChange(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      locationId: '',
      boxId: '',
      category: '',
      hasBox: '',
      hasLocation: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = Object.values(filters).some(v =>
    v && v !== 'createdAt' && v !== 'desc'
  );

  // Quick filter presets
  const applyPreset = (preset) => {
    const today = new Date();
    const presets = {
      recent7: {
        dateFrom: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      },
      recent30: {
        dateFrom: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      },
      noBox: {
        hasBox: 'false'
      },
      noLocation: {
        hasLocation: 'false'
      }
    };

    setFilters({ ...filters, ...presets[preset] });
  };

  return (
    <div style={{
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Search by name, category, or description..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{
            width: '100%',
            padding: '10px 15px',
            fontSize: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        />
      </div>

      {/* Quick Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => applyPreset('recent7')}
          className="btn-small"
          style={{ fontSize: '0.85rem' }}
        >
          📅 Last 7 Days
        </button>
        <button
          onClick={() => applyPreset('recent30')}
          className="btn-small"
          style={{ fontSize: '0.85rem' }}
        >
          📅 Last 30 Days
        </button>
        <button
          onClick={() => applyPreset('noBox')}
          className="btn-small"
          style={{ fontSize: '0.85rem' }}
        >
          📦 No Box
        </button>
        <button
          onClick={() => applyPreset('noLocation')}
          className="btn-small"
          style={{ fontSize: '0.85rem' }}
        >
          📍 No Location
        </button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          {showAdvanced ? '▲ Hide Filters' : '▼ More Filters'}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', marginLeft: 'auto' }}
          >
            ✕ Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          paddingTop: '15px',
          borderTop: '1px solid #e5e7eb'
        }}>
          {/* Location Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#6b7280' }}>
              Location
            </label>
            <select
              value={filters.locationId}
              onChange={(e) => handleFilterChange('locationId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.9rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Box Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#6b7280' }}>
              Box
            </label>
            <select
              value={filters.boxId}
              onChange={(e) => handleFilterChange('boxId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.9rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="">All Boxes</option>
              {boxes.map(box => (
                <option key={box.id} value={box.id}>
                  {box.name} {box.Location ? `(${box.Location.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#6b7280' }}>
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.9rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#6b7280' }}>
              Added From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.9rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            />
          </div>

          {/* Date To */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#6b7280' }}>
              Added To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.9rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            />
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#6b7280' }}>
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.9rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="createdAt">Date Added</option>
              <option value="updatedAt">Last Modified</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#6b7280' }}>
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.9rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div style={{
          marginTop: '15px',
          fontSize: '0.85rem',
          color: '#6b7280'
        }}>
          <strong>Active filters:</strong>
          {filters.search && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#dbeafe', borderRadius: '4px' }}>Search: {filters.search}</span>}
          {filters.locationId && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#dbeafe', borderRadius: '4px' }}>Location: {locations.find(l => l.id == filters.locationId)?.name}</span>}
          {filters.boxId && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#dbeafe', borderRadius: '4px' }}>Box: {boxes.find(b => b.id == filters.boxId)?.name}</span>}
          {filters.category && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#dbeafe', borderRadius: '4px' }}>Category: {filters.category}</span>}
          {filters.dateFrom && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#dbeafe', borderRadius: '4px' }}>From: {filters.dateFrom}</span>}
          {filters.dateTo && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#dbeafe', borderRadius: '4px' }}>To: {filters.dateTo}</span>}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
