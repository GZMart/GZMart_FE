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

const isValidCoord = (lat, lng) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

const FALLBACK_SELLER_POS = [108.2062, 16.0471];
const FALLBACK_BUYER_POS = [108.2429, 16.0878];

const isTrackingDebugEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('trackingDebug');
    if (fromQuery === '1' || fromQuery === 'true') {
      return true;
    }

    const fromStorage = window.localStorage.getItem('gzm_tracking_debug');
    return fromStorage === '1' || fromStorage === 'true';
  } catch (_err) {
    return false;
  }
};

const debugLog = () => {};

const toAddressText = (value, fallback = '') => {
  if (!value) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (typeof value === 'object') {
    const candidates = [value.fullAddress, value.formattedAddress, value.address, value.street];
    const selected = candidates.find((item) => typeof item === 'string' && item.trim());
    if (selected) {
      return selected.trim();
    }
  }

  return String(value).trim() || fallback;
};

const createMarkerElement = (iconUrl, size, emojiFallback = '📍', debugEnabled = false) => {
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.backgroundImage = `url(${iconUrl})`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = 'center';
  el.style.pointerEvents = 'none';

  const fallback = document.createElement('span');
  fallback.textContent = emojiFallback;
  fallback.style.fontSize = `${Math.max(14, Math.floor(size * 0.5))}px`;
  fallback.style.lineHeight = '1';
  fallback.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))';
  // Keep emoji visible while image is loading to avoid blank marker flashes.
  fallback.style.opacity = '1';
  el.appendChild(fallback);

  const img = new Image();
  img.onload = () => {
    fallback.style.opacity = '0';
  };
  img.onerror = () => {
    el.style.backgroundImage = 'none';
    fallback.style.opacity = '1';
  };
  img.src = iconUrl;

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
  syncTag,
}) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const animationRef = useRef(null);
  const intervalRef = useRef(null);
  const debugEnabledRef = useRef(isTrackingDebugEnabled());
  const joinedRoomRef = useRef(null);
  const onDeliveryCompleteRef = useRef(onDeliveryComplete);

  useEffect(() => {
    onDeliveryCompleteRef.current = onDeliveryComplete;
  }, [onDeliveryComplete]);

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
        void error;
      }
      return null;
    },
    [REST_API_KEY]
  );

  // --- Logic Animation (bám theo start time từ server) ---
  const startTruckAnimation = useCallback(
    (routeCoords, durationSeconds = 20, startedAt = null) => {
      if (!routeCoords || routeCoords.length === 0) {
        debugLog(debugEnabledRef.current, 'animation_skipped_empty_route', {
          routeLength: routeCoords?.length || 0,
        });
        return;
      }

      const durationMs = Math.max(1000, Number(durationSeconds || 20) * 1000);
      const startedAtMs = startedAt ? new Date(startedAt).getTime() : Date.now();
      let hasCompleted = false;

      const initialElapsed = Math.max(0, Date.now() - startedAtMs);
      const initialProgress = Math.min(initialElapsed / durationMs, 1);

      debugLog(debugEnabledRef.current, 'animation_start', {
        durationSeconds,
        durationMs,
        startedAt,
        startedAtMs,
        now: Date.now(),
        initialElapsed,
        initialProgress,
        routeLength: routeCoords.length,
        firstPoint: routeCoords[0],
        lastPoint: routeCoords[routeCoords.length - 1],
      });

      if (initialProgress >= 1) {
        debugLog(debugEnabledRef.current, 'animation_expired_on_start', {
          reason: 'elapsed_time_already_exceeds_duration',
          initialElapsed,
          durationMs,
        });
      }

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
          debugLog(debugEnabledRef.current, 'animation_completed', {
            elapsed,
            durationMs,
            routeLength: routeCoords.length,
          });
          if (onDeliveryCompleteRef.current && !hasCompleted) {
            hasCompleted = true;
            onDeliveryCompleteRef.current();

            // emit completion to sync room
            if (syncRoom) {
              try {
                socketService.emit('rma:delivery-sync', {
                  room: syncRoom,
                  tag: syncTag || null,
                  action: 'complete',
                  timestamp: new Date().toISOString(),
                });
              } catch (err) {
                void err;
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
          debugLog(debugEnabledRef.current, 'interval_force_complete', {
            elapsed,
            durationMs,
          });
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
          if (onDeliveryCompleteRef.current && !hasCompleted) {
            hasCompleted = true;
            onDeliveryCompleteRef.current();
            if (syncRoom) {
              try {
                socketService.emit('rma:delivery-sync', {
                  room: syncRoom,
                  tag: syncTag || null,
                  action: 'complete',
                  timestamp: new Date().toISOString(),
                });
              } catch (err) {
                void err;
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
    [syncRoom, syncTag]
  );

  useEffect(() => {
    let cancelled = false;

    if (!MAPTILES_KEY || !REST_API_KEY) {
      debugLog(debugEnabledRef.current, 'missing_goong_keys', {
        hasMaptilesKey: Boolean(MAPTILES_KEY),
        hasRestApiKey: Boolean(REST_API_KEY),
      });
      return;
    }

    if (!mapContainer.current) {
      debugLog(debugEnabledRef.current, 'map_container_missing_on_effect_start');
      return;
    }

    goongjs.accessToken = MAPTILES_KEY;
    debugLog(debugEnabledRef.current, 'map_effect_start', {
      sellerCoords,
      buyerCoords,
      duration,
      startTime,
      syncRoom,
      syncTag,
      debugMode: debugEnabledRef.current,
    });

    let fetchedStartTime = null;

    const initMapAndRoute = async () => {
      if (cancelled || !mapContainer.current) {
        debugLog(debugEnabledRef.current, 'init_aborted_before_resolve', {
          cancelled,
          hasContainer: Boolean(mapContainer.current),
        });
        return;
      }

      // 2. Resolve coordinates
      const resolveCoords = async (lat, lng, formattedAddress, address) => {
        if (lat != null && lng != null) {
          debugLog(debugEnabledRef.current, 'resolve_coords_direct', {
            lat,
            lng,
          });
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
            void err;
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

      // Fallback nếu không tìm thấy địa chỉ thì dùng tọa độ truyền vào (nếu hợp lệ), rồi mới tới demo.
      if (!realSellerPos) {
        realSellerPos = isValidCoord(sLat, sLng)
          ? [Number(sLng), Number(sLat)]
          : [...FALLBACK_SELLER_POS];
      }
      if (!realBuyerPos) {
        realBuyerPos = isValidCoord(bLat, bLng)
          ? [Number(bLng), Number(bLat)]
          : [...FALLBACK_BUYER_POS];
      }

      if (!isValidCoord(realSellerPos?.[1], realSellerPos?.[0])) {
        realSellerPos = [...FALLBACK_SELLER_POS];
      }
      if (!isValidCoord(realBuyerPos?.[1], realBuyerPos?.[0])) {
        realBuyerPos = [...FALLBACK_BUYER_POS];
      }

      if (cancelled || !mapContainer.current) {
        return;
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

      // Some style sprites from provider styles can be missing in local/dev env.
      // Add a transparent 1x1 fallback image to silence non-fatal style warnings.
      map.on('styleimagemissing', (evt) => {
        try {
          const imageId = evt?.id;
          if (!imageId || map.hasImage(imageId)) {
            return;
          }

          map.addImage(imageId, {
            width: 1,
            height: 1,
            data: new Uint8Array([0, 0, 0, 0]),
          });
        } catch (error) {
          void error;
        }
      });

      // 4. Lấy tuyến đường thực tế qua OSRM dựa trên tọa độ CHUẨN vừa quét được
      const url = `https://router.project-osrm.org/route/v1/driving/${realSellerPos[0]},${realSellerPos[1]};${realBuyerPos[0]},${realBuyerPos[1]}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (cancelled) {
        debugLog(debugEnabledRef.current, 'init_aborted_after_route_fetch');
        return;
      }

      let routeCoordinates = [realSellerPos, realBuyerPos];
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        routeCoordinates = data.routes[0].geometry.coordinates;
      }

      map.on('error', (err) => {
        void err;
      });

      map.on('load', () => {
        // Ensure proper render size in animated containers (drawer/modal/tab).
        map.resize();
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        }, 250);

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
        new goongjs.Marker(
          createMarkerElement(DELIVERY_SELLER_ICON_URL, 32, '🏬', debugEnabledRef.current)
        )
          .setLngLat(realSellerPos)
          .addTo(map);
        new goongjs.Marker(
          createMarkerElement(DELIVERY_BUYER_ICON_URL, 32, '🏠', debugEnabledRef.current)
        )
          .setLngLat(realBuyerPos)
          .addTo(map);

        const truckMarker = new goongjs.Marker(
          createMarkerElement(DELIVERY_VEHICLE_ICON_URL, 40, '🛵', debugEnabledRef.current)
        )
          .setLngLat(realSellerPos)
          .addTo(map);
        truckMarkerRef.current = truckMarker;

        // Prefer explicit startTime prop, fallback to server-fetched start time
        startTruckAnimation(routeCoordinates, duration, startTime || fetchedStartTime);
      });

      if (typeof ResizeObserver !== 'undefined' && mapContainer.current) {
        const resizeObserver = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        });
        resizeObserver.observe(mapContainer.current);
        map.__resizeObserver = resizeObserver;
      }
    };

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Prepare then initialize map
    const prepareAndInit = async () => {
      if (syncRoom && !startTime) {
        try {
          const resp = await rmaService.getReturnRequestById(syncRoom);
          const rr = resp && resp.data;
          // Try common fields that might carry start time
          fetchedStartTime =
            rr?.logistics?.startTime ||
            rr?.shippingStartedAt ||
            rr?.logistics?.shippingStartedAt ||
            null;
        } catch (err) {
          void err;
          // ignore, fallback to local time
        }
      }

      await initMapAndRoute();
    };

    prepareAndInit().catch((error) => {
      void error;
    });

    return () => {
      cancelled = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mapRef.current) {
        if (mapRef.current.__resizeObserver) {
          mapRef.current.__resizeObserver.disconnect();
          mapRef.current.__resizeObserver = null;
        }
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
    syncTag,
    geocodeAddress,
    startTruckAnimation,
    DELIVERY_VEHICLE_ICON_URL,
    DELIVERY_SELLER_ICON_URL,
    DELIVERY_BUYER_ICON_URL,
  ]);

  // Keep socket room join separate from map init to avoid repeated reconnect/join churn.
  useEffect(() => {
    if (!syncRoom) {
      return;
    }

    const roomName = `rma_${syncRoom}`;

    if (joinedRoomRef.current === roomName) {
      return;
    }

    try {
      socketService.connect();
      socketService.joinRoom(roomName);
      joinedRoomRef.current = roomName;
    } catch (err) {
      void err;
    }
  }, [syncRoom, syncTag]);

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
        const tagMatches = !syncTag || msg.tag === syncTag;
        if (!tagMatches) {
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
        void e;
      }
    };

    socketService.on('rma:delivery-sync', handler);
    return () => socketService.off('rma:delivery-sync', handler);
  }, [syncRoom, syncTag, onDeliveryComplete]);

  // Component render
  return (
    <div>
      <div ref={mapContainer} style={{ height: '400px', width: '100%', borderRadius: '8px' }} />

      <div className={styles['delivery-info']}>
        <div className={styles['delivery-route']}>
          <div className={styles['route-point']}>
            <div className={styles['route-details']}>
              <strong>Nơi gửi</strong>
              <p>
                {toAddressText(
                  sellerCoords?.formattedAddress || sellerCoords?.address,
                  'Địa chỉ người gửi chưa cập nhật'
                )}
              </p>
            </div>
          </div>
          <div className={`${styles['route-point']} ${styles['route-point-end']}`}>
            <div className={`${styles['route-details']} ${styles['route-details-end']}`}>
              <strong>Nơi nhận</strong>
              <p>
                {toAddressText(
                  buyerCoords?.formattedAddress || buyerCoords?.address,
                  'Địa chỉ người nhận chưa cập nhật'
                )}
              </p>
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
  syncTag: PropTypes.string,
};

export default DeliveryTrackingMap;
