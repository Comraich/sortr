import { useState } from 'react';
import { apiClient, getApiUrl } from './api/client';

const API_URL = getApiUrl();

function ImageUpload({ itemId, existingImages = [], onImagesUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (existingImages.length + files.length > 5) {
      setError(`Maximum 5 images allowed. You can add ${5 - existingImages.length} more.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${API_URL}/api/items/${itemId}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload images');
      }

      const data = await response.json();
      onImagesUpdate(data.images);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeleteImage = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await apiClient.delete(`/api/items/${itemId}/images/${filename}`);
      const updatedImages = existingImages.filter(img => img !== filename);
      onImagesUpdate(updatedImages);
    } catch (err) {
      setError(err.message);
    }
  };

  const getImageUrl = (filename) => {
    return `${API_URL}/uploads/${filename}`;
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Item Photos</h3>

      {/* Error Message */}
      {error && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          color: '#991b1b',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {/* Image Gallery */}
      {existingImages && existingImages.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}>
          {existingImages.map((filename, index) => (
            <div key={filename} style={{ position: 'relative' }}>
              <img
                src={getImageUrl(filename)}
                alt={`Item photo ${index + 1}`}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #e5e7eb'
                }}
                onClick={() => setSelectedImage(filename)}
              />
              <button
                onClick={() => handleDeleteImage(filename)}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Delete image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {existingImages.length < 5 && (
        <div>
          <label
            htmlFor="image-upload"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem'
            }}
          >
            {uploading ? 'Uploading...' : `📷 Add Photo${existingImages.length > 0 ? 's' : ''} (${existingImages.length}/5)`}
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>
            Maximum 5 images, up to 5MB each. Supports JPG, PNG, GIF, WebP.
          </p>
        </div>
      )}

      {/* Lightbox for enlarged image */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
            padding: '20px'
          }}
        >
          <img
            src={getImageUrl(selectedImage)}
            alt="Enlarged view"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
