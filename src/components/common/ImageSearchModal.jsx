import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import searchService from '../../services/api/searchService';

const ImageSearchModal = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSearch = async () => {
    if (!selectedFile) return;

    try {
      setIsSearching(true);
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await searchService.searchByImage(formData);
      
      // axiosClient interceptor already unwraps response.data, so `response` IS the body object
      if (response?.success) {
        onClose();
        navigate('/search/image', { 
          state: { 
            results: response.data?.products || [],
            analyzedInfo: response.data?.analyzedInfo || null,
            aiAnalysisFailed: response.data?.aiAnalysisFailed || false,
            previewUrl 
          } 
        });
      } else {
        toast.error('Failed to search image');
      }
    } catch (error) {
      console.error('Image search error:', error);
      toast.error(error.message || 'Error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 9998 }}
        onClick={() => !isSearching && onClose()}
      />
      <div
        className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow-lg"
        style={{
          zIndex: 9999,
          maxWidth: '500px',
          width: '90%',
          animation: 'fadeIn 0.2s ease-in-out',
        }}
      >
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <Camera size={20} className="text-secondary" />
            Search by Image
          </h5>
          <button onClick={onClose} className="btn-close" disabled={isSearching}></button>
        </div>

        <div className="p-4 text-center">
          {!previewUrl ? (
            <div 
              className="border border-2 border-dashed rounded p-5 bg-light"
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef';
                e.currentTarget.style.borderColor = '#0d6efd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <Upload size={48} className="text-muted mb-3" />
              <h6 className="fw-bold">Click or drag image here</h6>
              <p className="text-muted small mb-0">Supports JPG, PNG, WEBP (Max 5MB)</p>
            </div>
          ) : (
            <div className="position-relative d-inline-block">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="img-fluid rounded shadow-sm"
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
              {!isSearching && (
                <button
                  className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl('');
                    setSelectedFile(null);
                  }}
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileSelect}
          />
        </div>

        <div className="p-3 border-top d-flex justify-content-end gap-2">
          <button 
            className="btn btn-outline-secondary px-4" 
            onClick={onClose}
            disabled={isSearching}
          >
            Cancel
          </button>
          <button 
            className="btn px-4 text-white d-flex align-items-center gap-2"
            style={{ backgroundColor: '#EE4D2D', border: 'none' }}
            onClick={handleSearch}
            disabled={!selectedFile || isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing AI...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ImageSearchModal;
