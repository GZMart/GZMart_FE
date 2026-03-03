import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DeliveryTrackingMap.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom truck icon
const truckIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMTg5MGZmIj4KICA8cGF0aCBkPSJNMTggMThoLTJjMC0xLjEtLjktMi0yLTJzLTIgLjktMiAySDhjMC0xLjEtLjktMi0yLTJzLTIgLjktMiAySDJ2LTRoMTd2NGgtMXptMC04SDEyVjZoNWwzIDR2NGgtMnptLTEwIDRINFY2aDR2OHptMTAgNGMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJ6TTYgMThjMS4xIDAgMi0uOSAyLTJzLS45LTItMi0yLTIgLjktMiAyIC45IDIgMiAyeiIvPgo8L3N2Zz4=',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Store icon
const storeIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjNTJjNDFhIj4KICA8cGF0aCBkPSJNMTIgNS42OUw3IDE4aDEwbC01LTEyLjMxek0xMiAybDcgMTdjMCAuNTUtLjQ1IDEtMSAxSDZjLS41NSAwLTEtLjQ1LTEtMWw3LTE3em0wIDEwYzEuMSAwIDIgLjktMiAycy45IDItMiAyLTItLjktMi0yIC45LTIgMi0yeiIvPgo8L3N2Zz4=',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Home icon
const homeIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZmY0ZDRmIj4KICA8cGF0aCBkPSJNMTAgMjB2LTZoNHY2aDVWMTJoM0wxMiAzbC0xMCA5aDNWMjB6Ii8+Cjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Component to animate the truck marker along a route
const AnimatedTruck = ({ route, duration, onComplete }) => {
  const [position, setPosition] = useState(route[0]);
  const [progress, setProgress] = useState(0);
  const map = useMap();

  useEffect(() => {
    if (!route || route.length === 0) return;

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const totalDuration = endTime - startTime;
      const currentProgress = Math.min(elapsed / totalDuration, 1);

      if (currentProgress < 1) {
        // Calculate position along route based on progress
        const targetIndex = Math.floor(currentProgress * (route.length - 1));
        const nextIndex = Math.min(targetIndex + 1, route.length - 1);

        // Interpolate between waypoints for smooth animation
        const segmentProgress = currentProgress * (route.length - 1) - targetIndex;
        const currentPoint = route[targetIndex];
        const nextPoint = route[nextIndex];

        const lat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress;
        const lng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress;

        setPosition([lat, lng]);
        setProgress(currentProgress);

        // Center map on truck
        map.setView([lat, lng], map.getZoom());

        requestAnimationFrame(animate);
      } else {
        setPosition(route[route.length - 1]);
        setProgress(1);
        if (onComplete) {
          onComplete();
        }
      }
    };

    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, duration]);

  return (
    <Marker position={position} icon={truckIcon}>
      <Popup>
        <strong>Đang giao hàng</strong>
        <br />
        Tiến độ: {Math.round(progress * 100)}%
      </Popup>
    </Marker>
  );
};

AnimatedTruck.propTypes = {
  route: PropTypes.array.isRequired,
  duration: PropTypes.number.isRequired,
  onComplete: PropTypes.func,
};

const DeliveryTrackingMap = ({ sellerCoords, buyerCoords, duration = 60, onDeliveryComplete }) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(true);

  const sellerPosition = [sellerCoords.lat, sellerCoords.lng];
  const buyerPosition = [buyerCoords.lat, buyerCoords.lng];

  // Calculate center point for initial view
  const centerLat = (sellerCoords.lat + buyerCoords.lat) / 2;
  const centerLng = (sellerCoords.lng + buyerCoords.lng) / 2;

  // Fetch road route from OSRM API
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoadingRoute(true);
        // OSRM API - Free routing service
        const url = `https://router.project-osrm.org/route/v1/driving/${sellerCoords.lng},${sellerCoords.lat};${buyerCoords.lng},${buyerCoords.lat}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // Extract coordinates from OSRM response
          const coordinates = data.routes[0].geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]); // [lng, lat] -> [lat, lng]
          setRouteCoordinates(coordinates);
        } else {
          // Fallback to straight line if routing fails
          console.warn('OSRM routing failed, using straight line');
          setRouteCoordinates([sellerPosition, buyerPosition]);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to straight line
        setRouteCoordinates([sellerPosition, buyerPosition]);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerCoords.lat, sellerCoords.lng, buyerCoords.lat, buyerCoords.lng]);

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    if (onDeliveryComplete) {
      onDeliveryComplete();
    }
  };

  return (
    <div className="delivery-tracking-map-container">
      {loadingRoute && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#1890ff' }}>
          Đang tính toán tuyến đường... 🗺️
        </div>
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Seller marker */}
        <Marker position={sellerPosition} icon={storeIcon}>
          <Popup>
            <strong>Người bán</strong>
            <br />
            {sellerCoords.address}
          </Popup>
        </Marker>

        {/* Buyer marker */}
        <Marker position={buyerPosition} icon={homeIcon}>
          <Popup>
            <strong>Địa chỉ giao hàng</strong>
            <br />
            {buyerCoords.address}
          </Popup>
        </Marker>

        {/* Route line - follows actual roads */}
        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#1890ff" weight={4} opacity={0.7} />
        )}

        {/* Animated truck along the route */}
        {!loadingRoute && isAnimating && routeCoordinates.length > 0 && (
          <AnimatedTruck
            route={routeCoordinates}
            duration={duration}
            onComplete={handleAnimationComplete}
          />
        )}
      </MapContainer>

      <div className="delivery-info">
        <div className="delivery-route">
          <div className="route-point">
            <span className="route-icon seller">🏪</span>
            <div className="route-details">
              <strong>Điểm xuất phát</strong>
              <p>{sellerCoords.address}</p>
            </div>
          </div>
          <div className="route-arrow">→</div>
          <div className="route-point">
            <span className="route-icon buyer">🏠</span>
            <div className="route-details">
              <strong>Điểm đến</strong>
              <p>{buyerCoords.address}</p>
            </div>
          </div>
        </div>
        <div className="estimated-time">
          <strong>Thời gian dự kiến:</strong> ~{duration} giây (Demo)
          <br />
          <span style={{ fontSize: 12, color: '#52c41a', marginTop: 4, display: 'inline-block' }}>
            ✓ Đang dùng routing theo đường bộ thực tế
          </span>
        </div>
      </div>
    </div>
  );
};

DeliveryTrackingMap.propTypes = {
  sellerCoords: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired,
  }).isRequired,
  buyerCoords: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired,
  }).isRequired,
  duration: PropTypes.number,
  onDeliveryComplete: PropTypes.func,
};

export default DeliveryTrackingMap;
