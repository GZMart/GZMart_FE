import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';
import styles from '@assets/styles/buyer/Order/DeliveryTrackingMap.module.css';
import addressService from '@services/api/addressService';
import rmaService from '@services/api/rmaService';
import socketService from '@services/socket/socketService';

// Đã thay thế base64 bằng đường dẫn local gọn gàng
const defaultTruckIconUrl = '/icons/delivery-bike.png';
const defaultStoreIconUrl = '/icons/store-marker.png';
const defaultHomeIconUrl = '/icons/home-marker.png';

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

  // Read both VITE_ and GOONG_ prefixes for backward compatibility.
  const MAPTILES_KEY =
    import.meta.env.VITE_GOONG_MAPTILES_KEY || import.meta.env.GOONG_MAPTILES_KEY || '';
  const REST_API_KEY = import.meta.env.VITE_GOONG_API_KEY || import.meta.env.GOONG_API_KEY || '';
  const DELIVERY_VEHICLE_ICON_URL = vehicleIconUrl || defaultTruckIconUrl;
  const DELIVERY_SELLER_ICON_URL = sellerIconUrl || defaultStoreIconUrl;
  const DELIVERY_BUYER_ICON_URL = buyerIconUrl || defaultHomeIconUrl;

  // Bóc tách biến nguyên thủy để tránh lỗi infinite loop khi bỏ vào array dependencies
  const {
    lat: sLat,
    lng: sLng,
    address: sAddress,
    formattedAddress: sFormattedAddress,
  } = sellerCoords || {};
  const {
    lat: bLat,
    lng: bLng,
    address: bAddress,
    formattedAddress: bFormattedAddress,
  } = buyerCoords || {};

  // 1. Hàm tìm tọa độ thật từ địa chỉ chuỗi (Geocoding)
  const geocodeAddress = useCallback(
    async (address) => {
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
        // eslint-disable-next-line no-console
        console.error('Lỗi tìm địa chỉ:', error);
      }
      return null;
    },
    [REST_API_KEY]
  );

  // --- Logic Animation (bám theo start time từ server) ---
  const startTruckAnimation = useCallback(
    (routeCoords, durationSeconds = 10, startedAt = null) => {
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
                // eslint-disable-next-line no-console
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
      } catch (e) {
        /* silently ignore */
      }
      intervalRef.current = setInterval(() => {
        const elapsed = Math.max(0, Date.now() - startedAtMs);
        if (elapsed >= durationMs) {
          // Force finish
          try {
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
            }
          } catch (e) {
            /* silently ignore */
          }
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
                // eslint-disable-next-line no-console
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
          } catch (e) {
            /* silently ignore */
          }
        }
      }, 1000);
    },
    [onDeliveryComplete, syncRoom]
  );

  useEffect(() => {
    if (!MAPTILES_KEY || !REST_API_KEY) {
      return;
    }

    goongjs.accessToken = MAPTILES_KEY;

    let fetchedStartTime = null;

    const initMapAndRoute = async () => {
      // 2. Resolve coordinates
      const resolveCoords = async (lat, lng, formattedAddress, address) => {
        if (lat != null && lng != null) {
          return [lng, lat];
        }
        if (formattedAddress || address) {
          try {
            const payload = { address: formattedAddress || address };
            const resp = await addressService.geocodeString(payload);
            if (resp && resp.success && resp.data && resp.data.location) {
              return [resp.data.location.lng, resp.data.location.lat];
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Backend geocode-string failed, falling back to client geocode', err);
          }
        }
        if (address) {
          const clientGeo = await geocodeAddress(address);
          if (clientGeo) {
            return clientGeo;
          }
        }
        return null;
      };

      let realSellerPos = await resolveCoords(sLat, sLng, sFormattedAddress, sAddress);
      let realBuyerPos = await resolveCoords(bLat, bLng, bFormattedAddress, bAddress);

      // Fallback nếu không tìm thấy địa chỉ thì dùng tọa độ truyền vào
      if (!realSellerPos) {
        realSellerPos = [sLng, sLat];
      }
      if (!realBuyerPos) {
        realBuyerPos = [bLng, bLat];
      }

      const centerPos = [
        (realSellerPos[0] + realBuyerPos[0]) / 2,
        (realSellerPos[1] + realBuyerPos[1]) / 2,
      ];

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

        // Prefer explicit startTime prop, fallback to server-fetched start time
        startTruckAnimation(routeCoordinates, duration, startTime || fetchedStartTime);
      });
    };

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Join sync room early so we don't miss in-flight 'complete' messages
    if (syncRoom) {
      try {
        // eslint-disable-next-line no-console
        console.debug('[DeliveryTrackingMap] connecting to socket, room:', `rma_${syncRoom}`);
        socketService.connect();
        socketService.setUserId();
        socketService.joinRoom(`rma_${syncRoom}`);
        // eslint-disable-next-line no-console
        console.debug(`[DeliveryTrackingMap] joined room rma_${syncRoom}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[DeliveryTrackingMap] Socket join room failed', err);
      }
    }

    // Prepare then initialize map
    const prepareAndInit = async () => {
      if (syncRoom && !startTime) {
        try {
          // eslint-disable-next-line no-console
          console.debug('[DeliveryTrackingMap] fetching RMA for startTime, id=', syncRoom);
          const resp = await rmaService.getReturnRequestById(syncRoom);
          const rr = resp && resp.data;
          // Try common fields that might carry start time
          fetchedStartTime =
            rr?.logistics?.startTime ||
            rr?.shippingStartedAt ||
            rr?.logistics?.shippingStartedAt ||
            null;
          // eslint-disable-next-line no-console
          console.debug('[DeliveryTrackingMap] fetchedStartTime=', fetchedStartTime);
        } catch (err) {
          // eslint-disable-next-line no-console
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
    sAddress,
    sLat,
    sLng,
    sFormattedAddress,
    bAddress,
    bLat,
    bLng,
    bFormattedAddress,
    duration,
    startTime,
    syncRoom,
    geocodeAddress,
    startTruckAnimation,
    DELIVERY_VEHICLE_ICON_URL,
    DELIVERY_SELLER_ICON_URL,
    DELIVERY_BUYER_ICON_URL,
  ]);

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
          } catch (e) {
            /* silently ignore */
          }
          try {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          } catch (e) {
            /* silently ignore */
          }

          // Try to set marker to last coordinate from route source
          try {
            const src =
              mapRef.current && mapRef.current.getSource && mapRef.current.getSource('route');
            const data = src && (src._data || (src.serialize && src.serialize()));
            const coords = data && data.geometry && data.geometry.coordinates;
            if (coords && coords.length && truckMarkerRef.current) {
              truckMarkerRef.current.setLngLat(coords[coords.length - 1]);
            }
          } catch (e) {
            /* silently ignore */
          }

          if (onDeliveryComplete) {
            onDeliveryComplete();
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
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
