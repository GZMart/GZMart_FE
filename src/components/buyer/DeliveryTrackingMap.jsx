import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';
import styles from '../../assets/styles/DeliveryTrackingMap.module.css';
import addressService from '@services/api/addressService';
import rmaService from '@services/api/rmaService';
import socketService from '@services/socket/socketService';

const defaultTruckIconUrl =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMTg5MGZmIj4KICA8cGF0aCBkPSJNMTggMThoLTJjMC0xLjEtLjktMi0yLTJzLTIgLjktMiAySDhjMC0xLjEtLjktMi0yLTJzLTIgLjktMiAySDJ2LTRoMTd2NGgtMXptMC04SDEyVjZoNWwzIDR2NGgtMnptLTEwIDRINFY2aDR2OHptMTAgNGMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJ6TTYgMThjMS4xIDAgMi0uOSAyLTJzLS45LTItMi0yLTIgLjktMiAyIC45IDIgMiAyeiIvPgo8L3N2Zz4=';
const defaultStoreIconUrl =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjNTJjNDFhIj4KICA8cGF0aCBkPSJNMTIgNS42OUw3IDE4aDEwbC01LTEyLjMxek0xMiAybDcgMTdjMCAuNTUtLjQ1IDEtMSAxSDZjLS41NSAwLTEtLjQ1LTEtMWw3LTE3em0wIDEwYzEuMSAwIDIgLjktMiAycy45IDItMiAyLTItLjktMi0yIC45LTIgMi0yeiIvPgo8L3N2Zz4=';
const defaultHomeIconUrl =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZmY0ZDRmIj4KICA8cGF0aCBkPSJNMTAgMjB2LTZoNHY2aDVWMTJoM0wxMiAzbC0xMCA5aDNWMjB6Ii8+Cjwvc3ZnPg==';

const createMarkerElement = (iconUrl, size) => {
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.backgroundImage = `url(${iconUrl})`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = 'center';
  return el;
};

const DeliveryTrackingMap = ({
  sellerCoords,
  buyerCoords,
  onDeliveryComplete,
  duration,
  startTime,
  vehicleIconUrl,
  sellerIconUrl,
  buyerIconUrl,
  syncRoom,
}) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const animationRef = useRef(null);
  const intervalRef = useRef(null);
  const [loadingMsg, setLoadingMsg] = useState('Đang phân tích địa chỉ thực tế...');

  // Read both VITE_ and GOONG_ prefixes for backward compatibility.
  const MAPTILES_KEY =
    import.meta.env.VITE_GOONG_MAPTILES_KEY || import.meta.env.GOONG_MAPTILES_KEY || '';
  const REST_API_KEY = import.meta.env.VITE_GOONG_API_KEY || import.meta.env.GOONG_API_KEY || '';
  const DELIVERY_VEHICLE_ICON_URL =
    vehicleIconUrl ||
    import.meta.env.VITE_DELIVERY_VEHICLE_ICON_URL ||
    import.meta.env.DELIVERY_VEHICLE_ICON_URL ||
    defaultTruckIconUrl;
  const DELIVERY_SELLER_ICON_URL =
    sellerIconUrl ||
    import.meta.env.VITE_DELIVERY_SELLER_ICON_URL ||
    import.meta.env.DELIVERY_SELLER_ICON_URL ||
    defaultStoreIconUrl;
  const DELIVERY_BUYER_ICON_URL =
    buyerIconUrl ||
    import.meta.env.VITE_DELIVERY_BUYER_ICON_URL ||
    import.meta.env.DELIVERY_BUYER_ICON_URL ||
    defaultHomeIconUrl;

  // 1. Hàm tìm tọa độ thật từ địa chỉ chuỗi (Geocoding)
  const geocodeAddress = async (address) => {
    if (!REST_API_KEY || !address) {
return null;
}

    try {
      const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${REST_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return [lng, lat]; // Goong dùng chuỗi [lng, lat]
      }
    } catch (error) {
      console.error('Lỗi tìm địa chỉ:', error);
    }
    return null;
  };

  useEffect(() => {
    if (!MAPTILES_KEY || !REST_API_KEY) {
      setLoadingMsg('Thiếu GOONG_MAPTILES_KEY hoặc GOONG_API_KEY trong file .env');
      return;
    }

    goongjs.accessToken = MAPTILES_KEY;

    let fetchedStartTime = null;

    const initMapAndRoute = async () => {
      // 2. Resolve coordinates: prefer saved lat/lng; fallback to backend geocode by formattedAddress; last resort local Goong geocode
      const resolveCoords = async (coordsObj) => {
        // If object already has lat/lng, use it
        if (coordsObj && coordsObj.lat != null && coordsObj.lng != null) {
          return [coordsObj.lng, coordsObj.lat];
        }

        // If formattedAddress available, ask backend to geocode (uses server keys and rate limits)
        if (coordsObj && (coordsObj.formattedAddress || coordsObj.address)) {
          try {
            const payload = { address: coordsObj.formattedAddress || coordsObj.address };
            const resp = await addressService.geocodeString(payload);
            if (resp && resp.success && resp.data && resp.data.location) {
              return [resp.data.location.lng, resp.data.location.lat];
            }
          } catch (err) {
            console.warn('Backend geocode-string failed, falling back to client geocode', err);
          }
        }

        // Last resort: client-side Goong geocode using visible address string
        if (coordsObj && coordsObj.address) {
          const clientGeo = await geocodeAddress(coordsObj.address);
          if (clientGeo) {
return clientGeo;
}
        }

        return null;
      };

      let realSellerPos = await resolveCoords(sellerCoords);
      let realBuyerPos = await resolveCoords(buyerCoords);

      // Fallback nếu không tìm thấy địa chỉ thì dùng tọa độ truyền vào
      if (!realSellerPos) {
realSellerPos = [sellerCoords.lng, sellerCoords.lat];
}
      if (!realBuyerPos) {
realBuyerPos = [buyerCoords.lng, buyerCoords.lat];
}

      const centerPos = [
        (realSellerPos[0] + realBuyerPos[0]) / 2,
        (realSellerPos[1] + realBuyerPos[1]) / 2,
      ];

      setLoadingMsg('Đang tính toán tuyến đường...');

      // 3. Khởi tạo bản đồ Goong
      const map = new goongjs.Map({
        container: mapContainer.current,
        style: 'https://tiles.goong.io/assets/goong_map_web.json',
        center: centerPos,
        zoom: 12,
      });
      mapRef.current = map;

      // 4. Lấy tuyến đường thực tế qua OSRM dựa trên tọa độ CHUẨN vừa quét được
      const url = `https://router.project-osrm.org/route/v1/driving/${realSellerPos[0]},${realSellerPos[1]};${realBuyerPos[0]},${realBuyerPos[1]}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      let routeCoordinates = [realSellerPos, realBuyerPos];
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        routeCoordinates = data.routes[0].geometry.coordinates;
      }

      map.on('load', () => {
        // Vẽ đường đi
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: routeCoordinates },
          },
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#1890ff', 'line-width': 5, 'line-opacity': 0.8 },
        });

        // Đặt Marker
        new goongjs.Marker(createMarkerElement(DELIVERY_SELLER_ICON_URL, 32))
          .setLngLat(realSellerPos)
          .addTo(map);
        new goongjs.Marker(createMarkerElement(DELIVERY_BUYER_ICON_URL, 32))
          .setLngLat(realBuyerPos)
          .addTo(map);

        const truckMarker = new goongjs.Marker(createMarkerElement(DELIVERY_VEHICLE_ICON_URL, 40))
          .setLngLat(realSellerPos)
          .addTo(map);
        truckMarkerRef.current = truckMarker;

        setLoadingMsg(null); // Ẩn loading
        // Prefer explicit startTime prop, fallback to server-fetched start time
        startTruckAnimation(routeCoordinates, duration, startTime || fetchedStartTime); // Bắt đầu chạy theo tiến độ server
      });
    };

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Join sync room early so we don't miss in-flight 'complete' messages
    if (syncRoom) {
      try {
        console.debug('[DeliveryTrackingMap] connecting to socket, room:', `rma_${syncRoom}`);
        socketService.connect();
        socketService.setUserId();
        socketService.joinRoom(`rma_${syncRoom}`);
        console.debug(`[DeliveryTrackingMap] joined room rma_${  syncRoom}`);
      } catch (err) {
        console.warn('[DeliveryTrackingMap] Socket join room failed', err);
      }
    }
    // Prepare then initialize map (use async function so we can await rmaService)
    const prepareAndInit = async () => {
      if (syncRoom && !startTime) {
        try {
          console.debug('[DeliveryTrackingMap] fetching RMA for startTime, id=', syncRoom);
          const resp = await rmaService.getReturnRequestById(syncRoom);
          const rr = resp && resp.data;
          // Try common fields that might carry start time
          fetchedStartTime =
            rr?.logistics?.startTime ||
            rr?.shippingStartedAt ||
            rr?.logistics?.shippingStartedAt ||
            null;
          console.debug('[DeliveryTrackingMap] fetchedStartTime=', fetchedStartTime);
        } catch (err) {
          console.warn('[DeliveryTrackingMap] Failed to fetch RMA startTime', err);
          // ignore, fallback to local time
        }
      }

      await initMapAndRoute();
    };

    prepareAndInit();

    return () => {
      if (animationRef.current) {
cancelAnimationFrame(animationRef.current);
}
      if (intervalRef.current) {
clearInterval(intervalRef.current);
}
      if (mapRef.current) {
mapRef.current.remove();
}
      mapRef.current = null;
    };
  }, [
    MAPTILES_KEY,
    REST_API_KEY,
    sellerCoords.address,
    sellerCoords.lat,
    sellerCoords.lng,
    buyerCoords.address,
    buyerCoords.lat,
    buyerCoords.lng,
    duration,
    startTime,
  ]);

  // --- Logic Animation (bám theo start time từ server) ---
  const startTruckAnimation = (routeCoords, durationSeconds = 10, startedAt = null) => {
    if (!routeCoords || routeCoords.length === 0) {
return;
}

    const durationMs = Math.max(1000, Number(durationSeconds || 10) * 1000);
    const startedAtMs = startedAt ? new Date(startedAt).getTime() : Date.now();
    let hasCompleted = false;

    const animate = () => {
      const elapsed = Math.max(0, Date.now() - startedAtMs);
      const progress = Math.min(elapsed / durationMs, 1); // Tính % tiến độ

      if (progress < 1) {
        const targetIndex = Math.floor(progress * (routeCoords.length - 1));
        const nextIndex = Math.min(targetIndex + 1, routeCoords.length - 1);
        const segmentProgress = progress * (routeCoords.length - 1) - targetIndex;

        const currentPoint = routeCoords[targetIndex];
        const nextPoint = routeCoords[nextIndex];

        const lng = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress;
        const lat = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress;

        if (truckMarkerRef.current) {
truckMarkerRef.current.setLngLat([lng, lat]);
}

        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (truckMarkerRef.current) {
truckMarkerRef.current.setLngLat(routeCoords[routeCoords.length - 1]);
}
        if (onDeliveryComplete && !hasCompleted) {
          hasCompleted = true;
          onDeliveryComplete();

          // emit completion to sync room
          if (syncRoom) {
            try {
              socketService.emit('rma:delivery-sync', {
                room: syncRoom,
                action: 'complete',
                timestamp: new Date().toISOString(),
              });
            } catch (err) {
              console.warn('Failed to emit delivery-sync complete', err);
            }
          }
        }
      }
    };
    animationRef.current = requestAnimationFrame(animate);

    // Also start a background interval to ensure completion when tab is inactive
    try {
      if (intervalRef.current) {
clearInterval(intervalRef.current);
}
    } catch (e) {}
    intervalRef.current = setInterval(() => {
      const elapsed = Math.max(0, Date.now() - startedAtMs);
      if (elapsed >= durationMs) {
        // Force finish
        try {
          if (animationRef.current) {
cancelAnimationFrame(animationRef.current);
}
        } catch (e) {}
        if (truckMarkerRef.current) {
truckMarkerRef.current.setLngLat(routeCoords[routeCoords.length - 1]);
}
        if (onDeliveryComplete && !hasCompleted) {
          hasCompleted = true;
          onDeliveryComplete();
          if (syncRoom) {
            try {
              socketService.emit('rma:delivery-sync', {
                room: syncRoom,
                action: 'complete',
                timestamp: new Date().toISOString(),
              });
            } catch (err) {
              console.warn('Failed to emit delivery-sync complete', err);
            }
          }
        }
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        // Optionally update marker position at coarse granularity in background
        const progress = Math.min(elapsed / durationMs, 1);
        const idx = Math.floor(progress * (routeCoords.length - 1));
        const nextIdx = Math.min(idx + 1, routeCoords.length - 1);
        const segmentProgress = progress * (routeCoords.length - 1) - idx;
        const c = routeCoords[idx];
        const n = routeCoords[nextIdx];
        const lng = c[0] + (n[0] - c[0]) * segmentProgress;
        const lat = c[1] + (n[1] - c[1]) * segmentProgress;
        try {
          if (truckMarkerRef.current) {
truckMarkerRef.current.setLngLat([lng, lat]);
}
        } catch (e) {}
      }
    }, 1000);
  };

  // Socket listener effect: reacts to remote 'complete' for the same syncRoom
  useEffect(() => {
    if (!syncRoom) {
return undefined;
}

    const handler = (msg) => {
      try {
        if (!msg) {
return;
}
        const roomMatches = msg.room === syncRoom || msg.room === `rma_${syncRoom}`;
        if (!roomMatches) {
return;
}
        if (msg.action === 'complete') {
          try {
            if (animationRef.current) {
cancelAnimationFrame(animationRef.current);
}
          } catch (e) {}
          try {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          } catch (e) {}

          // Try to set marker to last coordinate from route source
          try {
            const src =
              mapRef.current && mapRef.current.getSource && mapRef.current.getSource('route');
            const data = src && (src._data || (src.serialize && src.serialize()));
            const coords = data && data.geometry && data.geometry.coordinates;
            if (coords && coords.length && truckMarkerRef.current) {
              truckMarkerRef.current.setLngLat(coords[coords.length - 1]);
            }
          } catch (e) {}

          if (onDeliveryComplete) {
onDeliveryComplete();
}
        }
      } catch (e) {
        console.warn('rma:delivery-sync handler error', e);
      }
    };

    socketService.on('rma:delivery-sync', handler);
    return () => socketService.off('rma:delivery-sync', handler);
  }, [syncRoom, onDeliveryComplete]);

  // Component render
  return (
    <div>
      <div ref={mapContainer} style={{ height: '400px', width: '100%', borderRadius: '8px' }} />

      <div className={styles['delivery-info']}>
        <div className={styles['delivery-route']}>
          <div className={styles['route-point']}>
            <div className={styles['route-details']}>
              <strong>Nơi gửi</strong>
              <p>{sellerCoords.address}</p>
            </div>
          </div>
          <div className={`${styles['route-point']} ${styles['route-point-end']}`}>
            <div className={`${styles['route-details']} ${styles['route-details-end']}`}>
              <strong>Nơi nhận</strong>
              <p>{buyerCoords.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DeliveryTrackingMap.propTypes = {
  sellerCoords: PropTypes.object.isRequired,
  buyerCoords: PropTypes.object.isRequired,
  onDeliveryComplete: PropTypes.func,
  duration: PropTypes.number,
  startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  vehicleIconUrl: PropTypes.string,
  sellerIconUrl: PropTypes.string,
  buyerIconUrl: PropTypes.string,
  syncRoom: PropTypes.string,
};

export default DeliveryTrackingMap;
