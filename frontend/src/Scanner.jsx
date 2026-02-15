import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { isAuthenticated } from './api/client';

const APP_URL = import.meta.env.VITE_APP_URL || (window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ''));

function Scanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, []);

  const parseQRCode = (decodedText) => {
    try {
      // Check if it's one of our app URLs
      const url = new URL(decodedText);

      // Extract the path from our app URL
      const basePath = new URL(APP_URL).pathname.replace(/\/$/, '');
      let path = url.pathname;

      // Remove base path if present
      if (basePath && path.startsWith(basePath)) {
        path = path.substring(basePath.length);
      }

      // Check if it matches our routes
      const itemMatch = path.match(/^\/item\/(\d+)$/);
      const boxMatch = path.match(/^\/box\/(\d+)$/);
      const locationMatch = path.match(/^\/location\/(\d+)$/);

      if (itemMatch) {
        return { type: 'item', id: itemMatch[1], path: `/item/${itemMatch[1]}` };
      } else if (boxMatch) {
        return { type: 'box', id: boxMatch[1], path: `/box/${boxMatch[1]}` };
      } else if (locationMatch) {
        return { type: 'location', id: locationMatch[1], path: `/location/${locationMatch[1]}` };
      } else {
        // Unknown URL format
        return { type: 'unknown', url: decodedText };
      }
    } catch (e) {
      // Not a valid URL - might be a barcode or other text
      return { type: 'barcode', value: decodedText };
    }
  };

  const handleScanSuccess = (decodedText) => {
    const result = parseQRCode(decodedText);
    setLastScanned(result);

    // Stop scanning
    stopScanning();

    // Navigate if we recognized the format
    if (result.path) {
      setTimeout(() => navigate(result.path), 500);
    } else if (result.type === 'barcode') {
      // For product barcodes, we could implement lookup here
      // For now, just show what was scanned
      console.log('Scanned barcode:', result.value);
    }
  };

  const handleScanError = (errorMessage) => {
    // Ignore common scan errors (scanning too fast, no QR code in frame, etc.)
    if (!errorMessage.includes('NotFoundException') && !errorMessage.includes('No MultiFormat Readers')) {
      console.warn('Scan error:', errorMessage);
    }
  };

  const startScanning = async () => {
    setError(null);
    setLastScanned(null);

    try {
      // Initialize scanner if not already done
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, // Use back camera
        config,
        handleScanSuccess,
        handleScanError
      );

      setScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(`Failed to start camera: ${err.message || 'Please ensure camera permissions are granted'}`);
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      const result = parseQRCode(manualInput.trim());
      setLastScanned(result);
      if (result.path) {
        navigate(result.path);
      }
    }
  };

  const renderScanResult = () => {
    if (!lastScanned) return null;

    let message = '';
    let icon = '';

    switch (lastScanned.type) {
      case 'item':
        icon = '📦';
        message = `Item found! Redirecting to item #${lastScanned.id}...`;
        break;
      case 'box':
        icon = '🗃️';
        message = `Box found! Redirecting to box #${lastScanned.id}...`;
        break;
      case 'location':
        icon = '📍';
        message = `Location found! Redirecting to location #${lastScanned.id}...`;
        break;
      case 'barcode':
        icon = '📊';
        message = `Product barcode scanned: ${lastScanned.value}`;
        break;
      case 'unknown':
        icon = '❓';
        message = `Scanned: ${lastScanned.url}`;
        break;
    }

    return (
      <div style={{
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#d1fae5',
        border: '1px solid #10b981',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '0.95rem', color: '#065f46' }}>{message}</div>
      </div>
    );
  };

  return (
    <div className="container">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>📷 Scan QR Code</h2>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            ← Back to Home
          </button>
        </div>

        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Scan QR codes on your boxes, locations, or items to quickly access them.
        </p>

        {/* Scan Result */}
        {renderScanResult()}

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '20px 0',
            padding: '15px',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

        {/* Scanner Preview */}
        <div style={{
          marginBottom: '20px',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f3f4f6',
          border: '2px dashed #d1d5db'
        }}>
          <div
            id="qr-reader"
            ref={scannerRef}
            style={{
              width: '100%',
              minHeight: scanning ? 'auto' : '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {!scanning && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📷</div>
                <p style={{ margin: 0 }}>Camera preview will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          {!scanning ? (
            <button onClick={startScanning} className="btn-primary" style={{ flex: 1 }}>
              Start Scanning
            </button>
          ) : (
            <button onClick={stopScanning} className="btn-secondary" style={{ flex: 1 }}>
              Stop Scanning
            </button>
          )}
        </div>

        {/* Manual Entry Section */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Manual Entry</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '15px' }}>
            Can't scan? Enter the URL or ID manually:
          </p>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste URL or enter item/box/location ID..."
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
              Go
            </button>
          </form>
          <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#9ca3af' }}>
            <p style={{ margin: '5px 0' }}>Examples:</p>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Paste full URL: {APP_URL}/item/123</li>
              <li>Or just enter: /item/123</li>
            </ul>
          </div>
        </div>

        {/* Tips Section */}
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #93c5fd'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#1e40af' }}>💡 Scanning Tips</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#1e40af' }}>
            <li>Hold the QR code steady in the camera frame</li>
            <li>Ensure good lighting conditions</li>
            <li>Keep the QR code flat and avoid glare</li>
            <li>The scanner will automatically detect and redirect</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default Scanner;
