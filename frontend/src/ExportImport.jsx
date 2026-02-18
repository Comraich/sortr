import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from './api/client';

const API_URL = getApiUrl();

function ExportImport() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);

      const response = await fetch(`${API_URL}/api/export/csv`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: {} })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Export to JSON
  const handleExportJSON = async () => {
    try {
      setExporting(true);

      const response = await fetch(`${API_URL}/api/export/json`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sortr-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export backup');
    } finally {
      setExporting(false);
    }
  };

  // Download import template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/export/template`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download error:', error);
      alert('Failed to download template');
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setImportError(null);
      setPreviewData(null);
    }
  };

  // Preview import
  const handlePreviewImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      setImportError(null);
      setPreviewData(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_URL}/api/export/csv-import?preview=true`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Preview failed');
      }

      setPreviewData(data);
    } catch (error) {
      console.error('Preview error:', error);
      setImportError(error.message);
    } finally {
      setImporting(false);
    }
  };

  // Perform import
  const handleImport = async () => {
    if (!selectedFile) return;

    if (!window.confirm(`Import ${previewData.validRows} items? This action cannot be undone.`)) {
      return;
    }

    try {
      setImporting(true);
      setImportError(null);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_URL}/api/export/csv-import`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data);
      setSelectedFile(null);
      setPreviewData(null);

      // Clear file input
      document.getElementById('csv-upload').value = '';
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Import / Export</h2>
        <Link to="/" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
          &larr; Back to Home
        </Link>
      </div>

      {/* Export Section */}
      <div style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>📤 Export Data</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Download your inventory data in various formats for backup or analysis.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="btn-primary"
            style={{ fontSize: '0.95rem' }}
          >
            {exporting ? 'Exporting...' : '📊 Export to CSV'}
          </button>
          <button
            onClick={handleExportJSON}
            disabled={exporting}
            className="btn-primary"
            style={{ fontSize: '0.95rem' }}
          >
            {exporting ? 'Exporting...' : '💾 Full Backup (JSON)'}
          </button>
        </div>

        <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', fontSize: '0.85rem', color: '#0369a1' }}>
          <strong>💡 Tip:</strong> CSV files can be opened in Excel or Google Sheets for analysis. JSON backups include all data for full restoration.
        </div>
      </div>

      {/* Import Section */}
      <div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>📥 Import Data</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Bulk import items from a CSV file. Download the template to see the required format.
        </p>

        {/* Template Download */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleDownloadTemplate}
            className="btn-secondary"
            style={{ fontSize: '0.9rem' }}
          >
            📋 Download CSV Template
          </button>
        </div>

        {/* File Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="csv-upload"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: selectedFile ? '#10b981' : '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            {selectedFile ? `✓ ${selectedFile.name}` : '📁 Select CSV File'}
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Preview Button */}
        {selectedFile && !previewData && (
          <button
            onClick={handlePreviewImport}
            disabled={importing}
            className="btn-primary"
            style={{ fontSize: '0.95rem', marginBottom: '20px' }}
          >
            {importing ? 'Analyzing...' : '🔍 Preview Import'}
          </button>
        )}

        {/* Preview Results */}
        {previewData && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '10px' }}>Preview Results</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '15px' }}>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total Rows</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>{previewData.totalRows}</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Valid</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{previewData.validRows}</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Errors</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{previewData.errorCount}</div>
              </div>
            </div>

            {previewData.errors && previewData.errors.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <h5 style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '8px' }}>Errors Found:</h5>
                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                  {previewData.errors.map((err, idx) => (
                    <div key={idx} style={{ padding: '6px', backgroundColor: '#fee2e2', borderRadius: '4px', marginBottom: '4px' }}>
                      Row {err.row}: {err.field} - {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewData.sampleRows && previewData.sampleRows.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <h5 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Sample Data (first 5 rows):</h5>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Category</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Box ID</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Location ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.sampleRows.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '6px' }}>{row.name}</td>
                          <td style={{ padding: '6px' }}>{row.category || '-'}</td>
                          <td style={{ padding: '6px' }}>{row.boxId || '-'}</td>
                          <td style={{ padding: '6px' }}>{row.locationId || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {previewData.errorCount === 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn-primary"
                  style={{ fontSize: '0.95rem' }}
                >
                  {importing ? 'Importing...' : `✓ Import ${previewData.validRows} Items`}
                </button>
              )}
              <button
                onClick={() => {
                  setPreviewData(null);
                  setSelectedFile(null);
                  document.getElementById('csv-upload').value = '';
                }}
                className="btn-secondary"
                style={{ fontSize: '0.95rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d1fae5', borderRadius: '8px', border: '1px solid #10b981' }}>
            <div style={{ color: '#065f46', fontSize: '1rem', fontWeight: 'bold' }}>
              ✓ {importResult.message}
            </div>
          </div>
        )}

        {/* Import Error */}
        {importError && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #ef4444' }}>
            <div style={{ color: '#991b1b', fontSize: '0.95rem' }}>
              ✗ {importError}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default ExportImport;
