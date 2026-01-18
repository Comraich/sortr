import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function QRCodeDisplay({ value, label, size = 150 }) {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const qrRef = useRef(null);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 300, 300);

      const link = document.createElement('a');
      link.download = `${label || 'qr-code'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${label}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px dashed #ccc;
              border-radius: 8px;
            }
            h2 { margin: 0 0 20px 0; font-size: 1.5rem; }
            p { margin: 15px 0 0 0; color: #666; font-size: 0.9rem; }
            @media print {
              .qr-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${label}</h2>
            ${qrRef.current?.innerHTML || ''}
            <p>${value}</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const buttonStyle = {
    padding: '6px 12px',
    fontSize: '0.8rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    transition: 'background-color 0.2s',
  };

  return (
    <>
      <div className="detail-qr">
        <div
          ref={qrRef}
          onClick={() => setIsEnlarged(true)}
          style={{ cursor: 'pointer' }}
          title="Click to enlarge"
        >
          <QRCodeSVG
            value={value}
            size={size}
            level="M"
          />
        </div>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '10px', textAlign: 'center' }}>
          Click to enlarge
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={downloadQR} style={buttonStyle} title="Download as PNG">
            Download
          </button>
          <button onClick={printQR} style={buttonStyle} title="Print QR code">
            Print
          </button>
          <button onClick={copyLink} style={{ ...buttonStyle, minWidth: '70px' }} title="Copy link to clipboard">
            {copyFeedback ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      {isEnlarged && (
        <div
          onClick={() => setIsEnlarged(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'default',
            }}
          >
            <h3 style={{ margin: '0 0 20px 0' }}>{label}</h3>
            <QRCodeSVG
              value={value}
              size={280}
              level="M"
            />
            <p style={{ margin: '15px 0 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
              {value}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button onClick={downloadQR} style={{ ...buttonStyle, padding: '10px 20px' }}>
                Download
              </button>
              <button onClick={printQR} style={{ ...buttonStyle, padding: '10px 20px' }}>
                Print
              </button>
              <button
                onClick={() => setIsEnlarged(false)}
                style={{ ...buttonStyle, padding: '10px 20px', backgroundColor: '#6b7280', color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QRCodeDisplay;
