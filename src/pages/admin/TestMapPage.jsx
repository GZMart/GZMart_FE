import React, { useState, useRef } from 'react';
import DeliveryTrackingMap from '@components/buyer/DeliveryTrackingMap';
import './TestMapPage.css';

const GOONG_API_KEY = import.meta.env.GOONG_API_KEY || import.meta.env.VITE_GOONG_API_KEY;

/* =========================================
   STYLING (Đưa ra ngoài để tối ưu hiệu suất)
========================================= */
const styles = {
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    zIndex: 1000,
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    maxHeight: '200px',
    overflowY: 'auto',
    padding: 0,
    margin: 0,
    listStyle: 'none',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  listItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
    color: '#333',
    background: '#fff',
  },
};

/* =========================================
   REUSABLE COMPONENT: Nhóm Input Vị trí
========================================= */
const LocationInput = ({
  title,
  placeholder,
  data,
  onAddressChange,
  onPlaceSelect,
  onCoordinateChange,
}) => (
  <div className="form-section">
    <h3>{title}</h3>
    <div className="form-group" style={{ position: 'relative', marginBottom: '15px' }}>
      <label>Tìm theo địa chỉ (Có gợi ý):</label>
      <input
        type="text"
        value={data.address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px' }}
      />

      {data.suggestions?.length > 0 && (
        <ul style={styles.dropdown}>
          {data.suggestions.map((place) => (
            <li
              key={place.place_id}
              style={styles.listItem}
              onClick={() => onPlaceSelect(place.place_id, place.description)}
              onMouseEnter={(e) => (e.target.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.target.style.background = '#fff')}
            >
              {place.description}
            </li>
          ))}
        </ul>
      )}
    </div>

    <div style={{ display: 'flex', gap: '10px' }}>
      <div className="form-group">
        <label>Lat:</label>
        {/* Đã gỡ readOnly và thêm onCoordinateChange */}
        <input
          type="number"
          step="0.0001"
          value={data.lat}
          onChange={(e) => onCoordinateChange('lat', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Lng:</label>
        {/* Đã gỡ readOnly và thêm onCoordinateChange */}
        <input
          type="number"
          step="0.0001"
          value={data.lng}
          onChange={(e) => onCoordinateChange('lng', e.target.value)}
        />
      </div>
    </div>
  </div>
);

/* =========================================
   MAIN COMPONENT
========================================= */
const TestMapPage = () => {
  // 1. Quản lý chung State của cả 2 điểm
  const [locations, setLocations] = useState({
    seller: { address: '', lat: '16.0471', lng: '108.2062', suggestions: [] },
    buyer: { address: '', lat: '16.0678', lng: '108.2208', suggestions: [] },
  });

  const [duration, setDuration] = useState('10');
  const [mapData, setMapData] = useState(null);
  const typingTimeoutRef = useRef(null);

  // Helper để cập nhật state dễ dàng hơn
  const updateLocation = (type, payload) => {
    setLocations((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...payload },
    }));
  };

  // 2. Logic Autocomplete
  const handleAddressChange = (value, type) => {
    updateLocation(type, { address: value });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (!value.trim()) {
      updateLocation(type, { suggestions: [] });
      return;
    }

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(value)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.predictions) {
          updateLocation(type, { suggestions: data.predictions });
        }
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý:', error);
      }
    }, 300);
  };

  // 3. Logic lấy tọa độ chi tiết khi chọn địa chỉ
  const handleSelectPlace = async (place_id, description, type) => {
    updateLocation(type, { address: description, suggestions: [] });

    try {
      const url = `https://rsapi.goong.io/Place/Detail?place_id=${place_id}&api_key=${GOONG_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.result?.geometry) {
        const { lat, lng } = data.result.geometry.location;
        updateLocation(type, { lat: lat.toString(), lng: lng.toString() });
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết địa điểm:', error);
    }
  };

  // 4. Logic khi người dùng tự sửa Lat/Lng bằng tay
  const handleCoordinateChange = (field, value, type) => {
    updateLocation(type, {
      [field]: value,
      address: '', // Reset trắng ô địa chỉ khi tọa độ thay đổi tay
      suggestions: [], // Ẩn luôn danh sách gợi ý (nếu đang bật)
    });
  };

  // 5. Submit hiển thị Map
  const handleShowMap = () => {
    setMapData({
      sellerCoords: {
        lat: parseFloat(locations.seller.lat),
        lng: parseFloat(locations.seller.lng),
        address:
          locations.seller.address || `Tọa độ: ${locations.seller.lat}, ${locations.seller.lng}`,
      },
      buyerCoords: {
        lat: parseFloat(locations.buyer.lat),
        lng: parseFloat(locations.buyer.lng),
        address:
          locations.buyer.address || `Tọa độ: ${locations.buyer.lat}, ${locations.buyer.lng}`,
      },
      duration: parseInt(duration),
      startTime: new Date(),
    });
  };

  return (
    <div className="test-map-page">
      <div className="test-map-container">
        <h1>Delivery Tracking Test</h1>

        <div className="test-map-form">
          {/* SELLER SECTION */}
          <LocationInput
            title="Seller Location"
            placeholder="Gõ '99 Hoa...' để xem gợi ý"
            data={locations.seller}
            onAddressChange={(val) => handleAddressChange(val, 'seller')}
            onPlaceSelect={(id, desc) => handleSelectPlace(id, desc, 'seller')}
            onCoordinateChange={(field, val) => handleCoordinateChange(field, val, 'seller')}
          />

          {/* BUYER SECTION */}
          <LocationInput
            title="Buyer Location"
            placeholder="Gõ tên đường, phường, thành phố..."
            data={locations.buyer}
            onAddressChange={(val) => handleAddressChange(val, 'buyer')}
            onPlaceSelect={(id, desc) => handleSelectPlace(id, desc, 'buyer')}
            onCoordinateChange={(field, val) => handleCoordinateChange(field, val, 'buyer')}
          />

          {/* ANIMATION SETTINGS */}
          <div className="form-section">
            <h3>Animation Settings</h3>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>Thời gian di chuyển (giây):</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={handleShowMap}>
              Show Map
            </button>
          </div>
        </div>

        {mapData && (
          <div className="test-map-output">
            <DeliveryTrackingMap
              sellerCoords={mapData.sellerCoords}
              buyerCoords={mapData.buyerCoords}
              duration={mapData.duration}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TestMapPage;
