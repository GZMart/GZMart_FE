import { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';
import styles from '@assets/styles/buyer/Order/DeliveryTrackingMap.module.css';
import addressService from '@services/api/addressService';
import rmaService from '@services/api/rmaService';
import socketService from '@services/socket/socketService';

const defaultTruckIconUrl = '/icons/delivery-bike.png';
const defaultStoreIconUrl = '/icons/store-marker.png';
const defaultHomeIconUrl = '/icons/home-marker.png';

const FALLBACK_SELLER_POS = [108.2062, 16.0471];
const FALLBACK_BUYER_POS = [108.2429, 16.0878];
const DEFAULT_ANIMATION_DURATION_SECONDS = 20;

const isValidCoord = (lat, lng) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

const normalizeLngLat = (coord, fallback) => {
  if (Array.isArray(coord) && isValidCoord(coord[1], coord[0])) {
    return [Number(coord[0]), Number(coord[1])];
  }

  if (coord && typeof coord === 'object' && isValidCoord(coord.lat, coord.lng)) {
    return [Number(coord.lng), Number(coord.lat)];
  }

  return [...fallback];
};

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

const debugLog = (enabled, event, payload) => {
  if (!enabled) {
    return;
  }

  try {
    // eslint-disable-next-line no-console
    console.log(`[DeliveryTrackingMap] ${event}`, payload || {});
  } catch (_error) {
    // ignore debug logging failure
  }
};

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

// Decode Google/Goong encoded polyline into GeoJSON-compatible [lng, lat] pairs.
const decodePolylineToLngLat = (encoded) => {
  if (!encoded || typeof encoded !== 'string') {
    return [];
  }

  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length + 1);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length + 1);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
};

const createMarkerElement = (iconUrl, size, emojiFallback = '📍') => {
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
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const sellerMarkerRef = useRef(null);
  const buyerMarkerRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const joinedRoomRef = useRef(null);
  const animationFrameRef = useRef(null);
  const completionIntervalRef = useRef(null);
  const onDeliveryCompleteRef = useRef(onDeliveryComplete);
  const debugEnabledRef = useRef(isTrackingDebugEnabled());
  const routeRequestIdRef = useRef(0);

  const [resolvedCoords, setResolvedCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [fetchedStartTime, setFetchedStartTime] = useState(null);

  const MAPTILES_KEY =
    import.meta.env.VITE_GOONG_MAPTILES_KEY || import.meta.env.GOONG_MAPTILES_KEY || '';
  const REST_API_KEY = import.meta.env.VITE_GOONG_API_KEY || import.meta.env.GOONG_API_KEY || '';

  const DELIVERY_VEHICLE_ICON_URL = vehicleIconUrl || defaultTruckIconUrl;
  const DELIVERY_SELLER_ICON_URL = sellerIconUrl || defaultStoreIconUrl;
  const DELIVERY_BUYER_ICON_URL = buyerIconUrl || defaultHomeIconUrl;

  useEffect(() => {
    onDeliveryCompleteRef.current = onDeliveryComplete;
  }, [onDeliveryComplete]);

  const geocodeAddress = useCallback(
    async (address) => {
      if (!REST_API_KEY || !address) {
        return null;
      }

      try {
        const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${REST_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data?.results?.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          if (isValidCoord(lat, lng)) {
            return [Number(lng), Number(lat)];
          }
        }
      } catch (error) {
        void error;
      }

      return null;
    },
    [REST_API_KEY]
  );

  // Effect 1: Resolve seller/buyer coordinates only.
  useEffect(() => {
    let cancelled = false;

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

    const resolveCoords = async (lat, lng, formattedAddress, address) => {
      if (isValidCoord(lat, lng)) {
        return [Number(lng), Number(lat)];
      }

      if (formattedAddress || address) {
        try {
          const payload = { address: formattedAddress || address };
          const resp = await addressService.geocodeString(payload);
          const result = resp?.data?.location;
          if (result && isValidCoord(result.lat, result.lng)) {
            return [Number(result.lng), Number(result.lat)];
          }
        } catch (error) {
          void error;
        }
      }

      if (address) {
        return geocodeAddress(address);
      }

      return null;
    };

    const resolve = async () => {
      let seller = await resolveCoords(sLat, sLng, sFormattedAddress, sAddress);
      let buyer = await resolveCoords(bLat, bLng, bFormattedAddress, bAddress);

      if (!seller || !isValidCoord(seller[1], seller[0])) {
        seller = [...FALLBACK_SELLER_POS];
      }
      if (!buyer || !isValidCoord(buyer[1], buyer[0])) {
        buyer = [...FALLBACK_BUYER_POS];
      }

      if (cancelled) {
        return;
      }

      setResolvedCoords({
        seller: normalizeLngLat(seller, FALLBACK_SELLER_POS),
        buyer: normalizeLngLat(buyer, FALLBACK_BUYER_POS),
      });
      debugLog(debugEnabledRef.current, 'coords_resolved', { seller, buyer });
    };

    resolve().catch((error) => {
      void error;
      if (!cancelled) {
        setResolvedCoords({
          seller: [...FALLBACK_SELLER_POS],
          buyer: [...FALLBACK_BUYER_POS],
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    sellerCoords?.lat,
    sellerCoords?.lng,
    sellerCoords?.address,
    sellerCoords?.formattedAddress,
    buyerCoords?.lat,
    buyerCoords?.lng,
    buyerCoords?.address,
    buyerCoords?.formattedAddress,
    geocodeAddress,
  ]);

  // Effect 2: Initialize map instance once.
  useEffect(() => {
    if (!MAPTILES_KEY || !REST_API_KEY || !mapContainerRef.current || mapRef.current) {
      return;
    }

    goongjs.accessToken = MAPTILES_KEY;

    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: FALLBACK_SELLER_POS,
      zoom: 12,
    });

    mapRef.current = map;

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });

      observer.observe(mapContainerRef.current);
      resizeObserverRef.current = observer;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (completionIntervalRef.current) {
        clearInterval(completionIntervalRef.current);
        completionIntervalRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [MAPTILES_KEY, REST_API_KEY]);

  // Effect 3: Build/update route and markers whenever map+coords are ready.
  useEffect(() => {
    if (!mapRef.current || !resolvedCoords || !REST_API_KEY) {
      return;
    }

    const map = mapRef.current;
    const seller = normalizeLngLat(resolvedCoords?.seller, FALLBACK_SELLER_POS);
    const buyer = normalizeLngLat(resolvedCoords?.buyer, FALLBACK_BUYER_POS);
    const requestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = requestId;
    let cancelled = false;

    const ensureRouteLayer = (coordinates) => {
      const routeGeoJson = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
      };

      const source = map.getSource('route');
      if (source) {
        source.setData(routeGeoJson);
      } else {
        map.addSource('route', { type: 'geojson', data: routeGeoJson });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#1890ff', 'line-width': 5, 'line-opacity': 0.8 },
        });
      }
    };

    const upsertMarkers = () => {
      const safeSeller = normalizeLngLat(seller, FALLBACK_SELLER_POS);
      const safeBuyer = normalizeLngLat(buyer, FALLBACK_BUYER_POS);

      if (!sellerMarkerRef.current) {
        sellerMarkerRef.current = new goongjs.Marker(
          createMarkerElement(DELIVERY_SELLER_ICON_URL, 32, '🏬')
        )
          .setLngLat(safeSeller)
          .addTo(map);
      }

      if (!buyerMarkerRef.current) {
        buyerMarkerRef.current = new goongjs.Marker(
          createMarkerElement(DELIVERY_BUYER_ICON_URL, 32, '🏠')
        )
          .setLngLat(safeBuyer)
          .addTo(map);
      }

      if (!truckMarkerRef.current) {
        truckMarkerRef.current = new goongjs.Marker(
          createMarkerElement(DELIVERY_VEHICLE_ICON_URL, 40, '🛵')
        )
          .setLngLat(safeSeller)
          .addTo(map);
      }

      sellerMarkerRef.current.setLngLat(safeSeller);
      buyerMarkerRef.current.setLngLat(safeBuyer);
      truckMarkerRef.current.setLngLat(safeSeller);
    };

    const fetchDirectionRoute = async (origin, destination) => {
      const endpointCandidates = [
        `https://rsapi.goong.io/Direction?origin=${origin}&destination=${destination}&vehicle=bike&api_key=${REST_API_KEY}`,
        `https://rsapi.goong.io/Direction/routing?origin=${origin}&destination=${destination}&vehicle=bike&api_key=${REST_API_KEY}`,
      ];

      for (const endpoint of endpointCandidates) {
        try {
          const response = await fetch(endpoint);
          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          const encoded = data?.routes?.[0]?.overview_polyline?.points;
          const decoded = decodePolylineToLngLat(encoded);
          if (decoded.length > 1) {
            return decoded;
          }
        } catch (error) {
          void error;
        }
      }

      return null;
    };

    const fetchRoute = async () => {
      const origin = `${seller[1]},${seller[0]}`;
      const destination = `${buyer[1]},${buyer[0]}`;

      let nextRoute = [seller, buyer];

      try {
        const decodedRoute = await fetchDirectionRoute(origin, destination);
        if (decodedRoute?.length > 1) {
          nextRoute = decodedRoute;
        }
      } catch (error) {
        void error;
      }

      if (cancelled || requestId !== routeRequestIdRef.current || !mapRef.current) {
        return;
      }

      const applyRoute = () => {
        if (cancelled || requestId !== routeRequestIdRef.current || !mapRef.current) {
          return;
        }

        ensureRouteLayer(nextRoute);
        upsertMarkers();
        setRouteCoordinates(nextRoute);

        const bounds = new goongjs.LngLatBounds();
        nextRoute.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 15 });
      };

      if (map.isStyleLoaded()) {
        applyRoute();
      } else {
        const onLoad = () => {
          map.off('load', onLoad);
          applyRoute();
        };
        map.on('load', onLoad);
      }
    };

    fetchRoute().catch((error) => {
      void error;
    });

    return () => {
      cancelled = true;
    };
  }, [
    resolvedCoords,
    REST_API_KEY,
    DELIVERY_VEHICLE_ICON_URL,
    DELIVERY_SELLER_ICON_URL,
    DELIVERY_BUYER_ICON_URL,
  ]);

  // Optional start-time hydration for synchronized playback when opening late.
  useEffect(() => {
    let cancelled = false;

    if (!syncRoom || startTime) {
      setFetchedStartTime(null);
      return;
    }

    const loadStartTime = async () => {
      try {
        const resp = await rmaService.getReturnRequestById(syncRoom);
        const rr = resp?.data;
        const value =
          rr?.logistics?.startTime ||
          rr?.shippingStartedAt ||
          rr?.logistics?.shippingStartedAt ||
          null;
        if (!cancelled) {
          setFetchedStartTime(value);
        }
      } catch (error) {
        void error;
      }
    };

    loadStartTime().catch((error) => {
      void error;
    });

    return () => {
      cancelled = true;
    };
  }, [syncRoom, startTime]);

  // Effect 4: Animate vehicle by latest route coordinates.
  useEffect(() => {
    if (!truckMarkerRef.current || !routeCoordinates?.length) {
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (completionIntervalRef.current) {
      clearInterval(completionIntervalRef.current);
      completionIntervalRef.current = null;
    }

    const durationSeconds = Math.max(1, Number(duration || DEFAULT_ANIMATION_DURATION_SECONDS));
    const durationMs = durationSeconds * 1000;
    const effectiveStartTime = startTime || fetchedStartTime || null;
    const parsedStartMs = effectiveStartTime ? new Date(effectiveStartTime).getTime() : Date.now();
    const startMs = Number.isFinite(parsedStartMs) ? parsedStartMs : Date.now();
    let completed = false;

    const finishAnimation = () => {
      if (completed) {
        return;
      }
      completed = true;

      const last = routeCoordinates[routeCoordinates.length - 1];
      if (truckMarkerRef.current && last) {
        truckMarkerRef.current.setLngLat(last);
      }

      if (onDeliveryCompleteRef.current) {
        onDeliveryCompleteRef.current();
      }

      if (syncRoom) {
        try {
          socketService.emit('rma:delivery-sync', {
            room: syncRoom,
            tag: syncTag || null,
            action: 'complete',
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          void error;
        }
      }
    };

    const animate = () => {
      const elapsed = Math.max(0, Date.now() - startMs);
      const progress = Math.min(elapsed / durationMs, 1);

      if (progress >= 1) {
        finishAnimation();
        return;
      }

      const segmentFloat = progress * (routeCoordinates.length - 1);
      const index = Math.floor(segmentFloat);
      const nextIndex = Math.min(index + 1, routeCoordinates.length - 1);
      const segmentProgress = segmentFloat - index;

      const current = routeCoordinates[index];
      const next = routeCoordinates[nextIndex];

      const lng = current[0] + (next[0] - current[0]) * segmentProgress;
      const lat = current[1] + (next[1] - current[1]) * segmentProgress;
      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLngLat([lng, lat]);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Interval fallback for inactive browser tabs.
    completionIntervalRef.current = setInterval(() => {
      const elapsed = Math.max(0, Date.now() - startMs);
      if (elapsed >= durationMs) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        finishAnimation();
        if (completionIntervalRef.current) {
          clearInterval(completionIntervalRef.current);
          completionIntervalRef.current = null;
        }
      }
    }, 1000);

    debugLog(debugEnabledRef.current, 'animation_started', {
      routeLength: routeCoordinates.length,
      durationSeconds,
      startMs,
      effectiveStartTime,
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (completionIntervalRef.current) {
        clearInterval(completionIntervalRef.current);
        completionIntervalRef.current = null;
      }
    };
  }, [routeCoordinates, duration, startTime, fetchedStartTime, syncRoom, syncTag]);

  // Keep socket room join separate from map effects.
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
    } catch (error) {
      void error;
    }
  }, [syncRoom]);

  // React to remote completion to keep both ends in sync.
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
        const tagMatches = !syncTag || msg.tag === syncTag;
        if (!roomMatches || !tagMatches || msg.action !== 'complete') {
          return;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (completionIntervalRef.current) {
          clearInterval(completionIntervalRef.current);
          completionIntervalRef.current = null;
        }

        const last = routeCoordinates[routeCoordinates.length - 1];
        if (truckMarkerRef.current && last) {
          truckMarkerRef.current.setLngLat(last);
        }

        if (onDeliveryCompleteRef.current) {
          onDeliveryCompleteRef.current();
        }
      } catch (error) {
        void error;
      }
    };

    socketService.on('rma:delivery-sync', handler);
    return () => socketService.off('rma:delivery-sync', handler);
  }, [syncRoom, syncTag, routeCoordinates]);

  return (
    <div>
      <div ref={mapContainerRef} style={{ height: '400px', width: '100%', borderRadius: '8px' }} />

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
