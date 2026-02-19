import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient, isAuthenticated } from './api/client';

const APP_URL = import.meta.env.VITE_APP_URL || (window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ''));

function PrintQR() {
  const [items, setItems] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
    fetchBoxes();
  }, []);

  const fetchItems = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiClient.get('/api/items/');
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
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
      console.error('Error fetching boxes:', err);
    }
  };

  const toggleItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleBox = (id) => {
    setSelectedBoxes(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const selectAllBoxes = () => {
    if (selectedBoxes.length === boxes.length) {
      setSelectedBoxes([]);
    } else {
      setSelectedBoxes(boxes.map(b => b.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedItemsData = items.filter(i => selectedItems.includes(i.id));
  const selectedBoxesData = boxes.filter(b => selectedBoxes.includes(b.id));
  const hasSelection = selectedItems.length > 0 || selectedBoxes.length > 0;

  return (
    <div className="print-qr-page">
      <section className="card no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Print QR Codes</h2>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 12px' }}>
            Back to Inventory
          </Link>
        </div>

        <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            className={activeTab === 'items' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('items')}
            style={{ padding: '5px 10px', fontSize: '0.8rem', width: 'auto' }}
          >
            Items ({items.length})
          </button>
          <button
            className={activeTab === 'boxes' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('boxes')}
            style={{ padding: '5px 10px', fontSize: '0.8rem', width: 'auto' }}
          >
            Boxes ({boxes.length})
          </button>
        </div>

        {activeTab === 'items' && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <button onClick={selectAllItems} className="btn-small">
                {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
              </button>
              <span style={{ marginLeft: '10px', color: '#6b7280' }}>
                {selectedItems.length} selected
              </span>
            </div>
            {items.length === 0 ? (
              <p>No items found.</p>
            ) : (
              <div className="selection-grid">
                {items.map(item => (
                  <label key={item.id} className={`selection-item ${selectedItems.includes(item.id) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className="item-name">{item.name}</span>
                    <span className="item-location">{item.Box?.Location?.name || item.Location?.name || '-'} {item.Box ? `/ ${item.Box.name}` : ''}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'boxes' && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <button onClick={selectAllBoxes} className="btn-small">
                {selectedBoxes.length === boxes.length ? 'Deselect All' : 'Select All'}
              </button>
              <span style={{ marginLeft: '10px', color: '#6b7280' }}>
                {selectedBoxes.length} selected
              </span>
            </div>
            {boxes.length === 0 ? (
              <p>No boxes found.</p>
            ) : (
              <div className="selection-grid">
                {boxes.map(box => (
                  <label key={box.id} className={`selection-item ${selectedBoxes.includes(box.id) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedBoxes.includes(box.id)}
                      onChange={() => toggleBox(box.id)}
                    />
                    <span className="item-name">{box.name}</span>
                    <span className="item-location">{box.Location?.name || '-'}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <button
            onClick={handlePrint}
            className="btn-primary"
            disabled={!hasSelection}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            Print {selectedItems.length + selectedBoxes.length} QR Code(s)
          </button>
        </div>
      </section>

      {hasSelection && (
        <section className="card print-preview">
          <h3 className="no-print" style={{ marginBottom: '20px' }}>Print Preview</h3>
          <div className="qr-grid">
            {selectedItemsData.map(item => (
              <div key={`item-${item.id}`} className="qr-card">
                <QRCodeSVG
                  value={`${APP_URL}/item/${item.id}`}
                  size={60}
                  level="M"
                />
                <div className="qr-label">
                  <strong>{item.name}</strong>
                  <span className="qr-sublabel">
                    {item.Box?.name
                      ? `${item.Box.Location?.name} / ${item.Box.name}`
                      : item.Location?.name || 'No location assigned'}
                  </span>
                </div>
              </div>
            ))}
            {selectedBoxesData.map(box => (
              <div key={`box-${box.id}`} className="qr-card">
                <QRCodeSVG
                  value={`${APP_URL}/box/${box.id}`}
                  size={60}
                  level="M"
                />
                <div className="qr-label">
                  <strong>{box.name}</strong>
                  <span className="qr-sublabel">{box.Location?.name || 'No location'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default PrintQR;
