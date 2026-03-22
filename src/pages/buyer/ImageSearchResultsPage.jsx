import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, AlertCircle, Sparkles, Tag, Package, Palette } from 'lucide-react';
import ProductCard from '../../components/common/ProductCard';
import { PUBLIC_ROUTES } from '../../constants/routes';

const ImageSearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [results, setResults] = useState([]);
  const [analyzedInfo, setAnalyzedInfo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    // If accessed directly without state, redirect to home
    if (!location.state || !location.state.previewUrl) {
      navigate(PUBLIC_ROUTES.HOME);
      return;
    }

    setResults(location.state.results || []);
    setAnalyzedInfo(location.state.analyzedInfo || null);
    setPreviewUrl(location.state.previewUrl);
  }, [location, navigate]);

  if (!previewUrl) return null;

  return (
    <div className="container py-4 my-3" style={{ minHeight: '60vh' }}>
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-4">
          <div className="bg-white rounded shadow-sm border p-4 h-100 sticky-top" style={{ top: '80px', zIndex: 10 }}>
            <h5 className="fw-bold d-flex align-items-center gap-2 mb-4 border-bottom pb-3">
              <Camera size={20} className="text-secondary" />
              Visual Analysis
            </h5>
            
            <div className="mb-4 text-center bg-light rounded p-2">
              <img 
                src={previewUrl} 
                alt="Search query" 
                className="img-fluid rounded"
                style={{ maxHeight: '250px', objectFit: 'contain' }}
              />
            </div>
            
            {analyzedInfo && (
              <div className="mt-4">
                <h6 className="fw-bold d-flex align-items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-warning" />
                  AI Identified Features
                </h6>
                <ul className="list-group list-group-flush small">
                  {analyzedInfo.category && (
                    <li className="list-group-item px-0 d-flex gap-2 bg-transparent border-0 pb-2">
                      <Package size={16} className="text-muted mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-muted d-block text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Category & Type</span>
                        <span className="fw-medium">{analyzedInfo.category}</span>
                      </div>
                    </li>
                  )}
                  {analyzedInfo.brand && analyzedInfo.brand !== "Unknown" && (
                    <li className="list-group-item px-0 d-flex gap-2 bg-transparent border-0 pb-2">
                      <Tag size={16} className="text-muted mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-muted d-block text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Brand</span>
                        <span className="fw-medium">{analyzedInfo.brand}</span>
                      </div>
                    </li>
                  )}
                  {analyzedInfo.colors && analyzedInfo.colors.length > 0 && (
                    <li className="list-group-item px-0 d-flex gap-2 bg-transparent border-0 pb-2">
                      <Palette size={16} className="text-muted mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-muted d-block text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Colors</span>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {analyzedInfo.colors.map(color => (
                            <span key={color} className="badge bg-light text-dark border fw-normal">{color}</span>
                          ))}
                        </div>
                      </div>
                    </li>
                  )}
                  {analyzedInfo.features && (
                    <li className="list-group-item px-0 bg-transparent border-0">
                      <span className="text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Key Details</span>
                      <span className="fst-italic text-secondary">{analyzedInfo.features}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.8rem' }}>
              To search another image, click the camera icon in the search bar above.
            </div>
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <h4 className="fw-bold mb-0">Similar Products</h4>
            <span className="text-muted border rounded px-2 py-1 small">{results.length} found</span>
          </div>

          {results.length > 0 ? (
            <div className="row row-cols-2 row-cols-md-3 g-3">
              {results.map((product) => (
                <div key={product._id} className="col">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 bg-white rounded shadow-sm border mt-4">
              <AlertCircle size={48} className="text-secondary opacity-50 mb-3 mx-auto" />
              <h5 className="fw-bold text-dark">No similar products found</h5>
              <p className="text-muted mb-0 mx-auto" style={{ maxWidth: '300px' }}>
                We couldn't find products matching the specific visual characteristics of your image. Try taking a clearer photo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSearchResultsPage;
