import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Locate,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Layers,
  Compass,
  Car,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// ─── Google Maps Style Authentic Markers ──────────────────────────────

/**
 * Google Maps Signature Red Destination Pin
 */
const createDropoffMarkerIcon = () =>
  L.divIcon({
    className: 'gm-marker-wrap',
    html: `
      <div class="gm-pin-container" style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <!-- Pin Body -->
        <div style="
          width: 34px; height: 46px;
          position: relative;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
          animation: gmPinDrop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        ">
          <svg viewBox="0 0 384 512" width="34" height="46" style="display:block;">
            <path fill="#EA4335" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
            <circle cx="192" cy="192" r="72" fill="#FFFFFF"/>
            <circle cx="192" cy="192" r="42" fill="#B31412"/>
          </svg>
        </div>
        <!-- Ground Shadow -->
        <div style="
          width: 18px; height: 6px;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 75%);
          border-radius: 50%;
          margin-top: -3px;
        "></div>
      </div>
    `,
    iconSize: [34, 49],
    iconAnchor: [17, 46],
    popupAnchor: [0, -48],
  });

/**
 * Google Maps Signature Green Pickup Pin
 */
const createPickupMarkerIcon = () =>
  L.divIcon({
    className: 'gm-marker-wrap',
    html: `
      <div class="gm-pin-container" style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <!-- Pin Body -->
        <div style="
          width: 34px; height: 46px;
          position: relative;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
          animation: gmPinDrop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        ">
          <svg viewBox="0 0 384 512" width="34" height="46" style="display:block;">
            <path fill="#34A853" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
            <circle cx="192" cy="192" r="72" fill="#FFFFFF"/>
            <circle cx="192" cy="192" r="42" fill="#137333"/>
          </svg>
        </div>
        <!-- Ground Shadow -->
        <div style="
          width: 18px; height: 6px;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 75%);
          border-radius: 50%;
          margin-top: -3px;
        "></div>
      </div>
    `,
    iconSize: [34, 49],
    iconAnchor: [17, 46],
    popupAnchor: [0, -48],
  });

/**
 * Google Maps Turn-by-Turn Navigation Puck with Heading Beam & Vehicle Avatar
 */
const createDriverMarkerIcon = (heading = 0) =>
  L.divIcon({
    className: 'gm-driver-puck',
    html: `
      <div style="position:relative;width:64px;height:64px;display:flex;align-items:center;justify-content:center;">
        <!-- Forward Navigation Directional Light Beam -->
        <div style="
          position: absolute;
          top: -24px;
          width: 48px;
          height: 48px;
          background: radial-gradient(circle at 50% 100%, rgba(66, 133, 244, 0.45) 0%, rgba(66, 133, 244, 0) 70%);
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          transform: rotate(${heading}deg);
          transform-origin: 50% 48px;
          pointer-events: none;
        "></div>

        <!-- Radar Pulse Ring -->
        <div style="
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: rgba(66, 133, 244, 0.22);
          animation: gmPuckPulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>

        <!-- Accuracy Ring -->
        <div style="
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          border: 2px solid rgba(66, 133, 244, 0.4);
        "></div>

        <!-- Center Vehicle Disc -->
        <div style="
          position: relative;
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a73e8, #4285f4);
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(26, 115, 232, 0.45), 0 1px 3px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading}deg);
          transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <!-- Car / Navigation Arrow Icon -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="display:block;">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
    popupAnchor: [0, -32],
  });

// ─── Status Labels ────────────────────────────────────────────────────
const STATUS_LABELS = {
  finding_driver:      { text: 'Finding Nearby Driver…', color: '#1a73e8', bg: '#e8f0fe', badge: 'Matching' },
  accepted:            { text: 'Driver Confirmed',        color: '#137333', bg: '#e6f4ea', badge: 'Assigned' },
  driver_arriving:     { text: 'Driver On The Way',      color: '#188038', bg: '#e6f4ea', badge: 'Arriving' },
  arrived:             { text: 'Driver at Pickup',       color: '#ea8600', bg: '#fef7e0', badge: 'Arrived' },
  in_progress:         { text: 'Heading to Destination', color: '#1a73e8', bg: '#e8f0fe', badge: 'In Trip' },
  completed:           { text: 'Trip Completed',         color: '#5f6368', bg: '#f1f3f4', badge: 'Ended' },
  cancelled:           { text: 'Ride Cancelled',         color: '#d93025', bg: '#fce8e6', badge: 'Cancelled' },
  no_driver_available: { text: 'No Driver Available',    color: '#d93025', bg: '#fce8e6', badge: 'Retry' },
};

// ─── Authentic Google Maps Tile Layers ─────────────────────────────────
const TILE_LAYERS = {
  google_streets: {
    id: 'google_streets',
    label: 'Google Streets',
    icon: '🗺️',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 21,
    attribution: 'Map data © Google',
    description: 'Clean roads, high-contrast street names & landmarks',
  },
  google_traffic: {
    id: 'google_traffic',
    label: 'Live Traffic',
    icon: '🚦',
    url: 'https://mt{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 21,
    attribution: 'Map data © Google • Live Traffic',
    description: 'Streets with real-time green/yellow/red traffic flow',
  },
  google_satellite: {
    id: 'google_satellite',
    label: 'Satellite (Hybrid)',
    icon: '🛰️',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 21,
    attribution: 'Imagery © Google • Maxar',
    description: 'Crisp satellite photo imagery with street overlay',
  },
  google_terrain: {
    id: 'google_terrain',
    label: 'Terrain',
    icon: '⛰️',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 21,
    attribution: 'Map data © Google',
    description: 'Topographic contour elevation and road paths',
  },
  osm: {
    id: 'osm',
    label: 'OpenStreetMap',
    icon: '🌐',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
    description: 'Classic open-source community street grid',
  },
};

export default function RideMap({
  pickupLocation,
  dropoffLocation,
  driverLocation,
  routeGeometry = [],
  rideStatus,
  height = '440px',
  className = '',
  showControls = true,
  etaMinutes,
  distanceKm,
}) {
  const containerRef       = useRef(null);
  const mapElementRef      = useRef(null);
  const mapInstanceRef     = useRef(null);
  const markersRef         = useRef({});
  const polylineBorderRef  = useRef(null);
  const polylineCoreRef    = useRef(null);
  const polylinePulseRef   = useRef(null);
  const tileLayerRef       = useRef(null);

  const [mapReady, setMapReady]           = useState(false);
  const [activeLayer, setActiveLayer]     = useState('google_streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [isTrafficActive, setIsTrafficActive] = useState(false);
  // Auto-fetched OSRM road route when no routeGeometry is passed in
  const [osrmRoute, setOsrmRoute] = useState([]);

  // Normalize lat/lng from different coordinate formats [lng, lat] vs {lat, lng} or nested GeoJSON
  const parseCoordinates = useCallback((coords) => {
    if (!coords) return null;
    let target = coords;
    while (target && target.coordinates && !Array.isArray(target)) {
      target = target.coordinates;
    }
    if (Array.isArray(target) && target.length === 2) {
      const [a, b] = target;
      // If longitude is first (> 50 for India/Udaipur which is ~73 lng, 24 lat)
      if (Math.abs(a) > 60 && Math.abs(b) < 40) {
        return [parseFloat(b), parseFloat(a)];
      }
      return [parseFloat(a), parseFloat(b)];
    }
    if (target && target.lat !== undefined && target.lng !== undefined) {
      return [parseFloat(target.lat), parseFloat(target.lng)];
    }
    return null;
  }, []);

  const pickupLatLng  = parseCoordinates(pickupLocation?.coordinates  || pickupLocation);
  const dropoffLatLng = parseCoordinates(dropoffLocation?.coordinates || dropoffLocation);
  const driverLatLng  = parseCoordinates(driverLocation?.coordinates  || driverLocation);
  const defaultCenter = pickupLatLng || [24.5854, 73.6826]; // Udaipur center

  // ─── 1. Map Initialization ──────────────────────────────────────────
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    const map = L.map(mapElementRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      maxZoom: 21,
      minZoom: 3,
      scrollWheelZoom: true,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    // Add Initial Google Streets Tile Layer
    const initialConfig = TILE_LAYERS[activeLayer];
    tileLayerRef.current = L.tileLayer(initialConfig.url, {
      subdomains: initialConfig.subdomains,
      maxZoom: initialConfig.maxZoom,
      crossOrigin: true,
    }).addTo(map);

    // Google-style Minimal Scale Bar (Bottom Left)
    L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false,
      maxWidth: 120,
    }).addTo(map);

    // Attribution (Bottom Right)
    L.control.attribution({
      position: 'bottomright',
      prefix: `<span style="font-family: Roboto, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; color: #5f6368; letter-spacing: 0.2px;">${initialConfig.attribution}</span>`,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    // Watch fullscreen changes
    const onFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      setTimeout(() => map.invalidateSize(), 200);
    };
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      map.remove();
      mapInstanceRef.current    = null;
      tileLayerRef.current      = null;
      polylineBorderRef.current = null;
      polylineCoreRef.current   = null;
      polylinePulseRef.current  = null;
      markersRef.current        = {};
      setMapReady(false);
    };
  }, []);

  // ─── Auto-fetch OSRM road route when routeGeometry is not provided ──
  useEffect(() => {
    if (!pickupLatLng || !dropoffLatLng) { setOsrmRoute([]); return; }
    // If caller already provided a proper multi-point route, skip
    if (routeGeometry && routeGeometry.length > 2) { setOsrmRoute([]); return; }

    let cancelled = false;
    const fetchRoute = async () => {
      try {
        const [lat1, lng1] = pickupLatLng;   // pickupLatLng is [lat, lng]
        const [lat2, lng2] = dropoffLatLng;
        const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.code === 'Ok' && data.routes?.length > 0) {
          // OSRM returns [lng, lat] pairs — convert to Leaflet [lat, lng]
          const pts = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setOsrmRoute(pts);
        }
      } catch (_) { /* network / abort — keep straight line */ }
    };

    const timer = setTimeout(fetchRoute, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [pickupLatLng?.[0], pickupLatLng?.[1], dropoffLatLng?.[0], dropoffLatLng?.[1], routeGeometry]);

  // ─── 2. Switch Tile Layer / Traffic Overlay ──────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const targetKey = isTrafficActive ? 'google_traffic' : activeLayer;
    const cfg = TILE_LAYERS[targetKey] || TILE_LAYERS.google_streets;

    tileLayerRef.current = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains,
      maxZoom: cfg.maxZoom,
      crossOrigin: true,
    }).addTo(map);

    tileLayerRef.current.bringToBack();
  }, [activeLayer, isTrafficActive, mapReady]);

  // ─── 3. Markers, Google Route Polyline & Bounds ─────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    const bounds = L.latLngBounds([]);

    // Google-style Popup HTML Template
    const createGooglePopup = (title, address, color, type) => `
      <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, sans-serif; min-width: 180px; padding: 2px 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: ${color};">
              ${type}
            </span>
          </div>
          <span style="font-size: 10px; color: #5f6368; background: #f1f3f4; padding: 1px 6px; border-radius: 10px;">
            Sanghini
          </span>
        </div>
        <div style="font-size: 13px; font-weight: 600; color: #202124; line-height: 1.4; margin-bottom: 4px;">
          ${title}
        </div>
        ${address && address !== title ? `
          <div style="font-size: 11px; color: #5f6368; line-height: 1.35; border-top: 1px solid #f1f3f4; padding-top: 4px; margin-top: 4px;">
            ${address}
          </div>
        ` : ''}
      </div>
    `;

    // A. Pickup Marker
    if (pickupLatLng) {
      const address = pickupLocation?.address || 'Pickup Point';
      if (!markersRef.current.pickup) {
        const m = L.marker(pickupLatLng, {
          icon: createPickupMarkerIcon(),
          zIndexOffset: 800,
          title: 'Pickup Location',
        }).addTo(map);

        m.bindPopup(createGooglePopup('Pickup Location', address, '#137333', 'Pickup'), {
          className: 'gm-style-popup',
          offset: [0, -12],
          maxWidth: 260,
        });
        markersRef.current.pickup = m;
      } else {
        markersRef.current.pickup.setLatLng(pickupLatLng);
        markersRef.current.pickup.setPopupContent(
          createGooglePopup('Pickup Location', address, '#137333', 'Pickup')
        );
      }
      bounds.extend(pickupLatLng);
    }

    // B. Destination Marker
    if (dropoffLatLng) {
      const address = dropoffLocation?.address || 'Destination Point';
      if (!markersRef.current.dropoff) {
        const m = L.marker(dropoffLatLng, {
          icon: createDropoffMarkerIcon(),
          zIndexOffset: 850,
          title: 'Destination',
        }).addTo(map);

        m.bindPopup(createGooglePopup('Destination', address, '#d93025', 'Dropoff'), {
          className: 'gm-style-popup',
          offset: [0, -12],
          maxWidth: 260,
        });
        markersRef.current.dropoff = m;
      } else {
        markersRef.current.dropoff.setLatLng(dropoffLatLng);
        markersRef.current.dropoff.setPopupContent(
          createGooglePopup('Destination', address, '#d93025', 'Dropoff')
        );
      }
      bounds.extend(dropoffLatLng);
    }

    // C. Driver Live Navigation Marker
    if (driverLatLng) {
      const heading = driverLocation?.heading || 0;
      if (!markersRef.current.driver) {
        const m = L.marker(driverLatLng, {
          icon: createDriverMarkerIcon(heading),
          zIndexOffset: 1200,
          title: 'Sanghini Driver',
        }).addTo(map);

        m.bindPopup(
          createGooglePopup('Sanghini Driver', 'Live Navigation • En Route', '#1a73e8', 'Driver'),
          { className: 'gm-style-popup', offset: [0, -6], maxWidth: 220 }
        );
        markersRef.current.driver = m;
      } else {
        markersRef.current.driver.setLatLng(driverLatLng);
        markersRef.current.driver.setIcon(createDriverMarkerIcon(heading));
      }
      bounds.extend(driverLatLng);
    }

    // D. Google Maps Navigation Route Polyline
    let routePoints = [];
    if (routeGeometry && routeGeometry.length > 0) {
      // Caller-provided geometry: OSRM [lng,lat] pairs
      routePoints = routeGeometry.map(([lng, lat]) => [lat, lng]);
    } else if (osrmRoute.length > 0) {
      // Auto-fetched road route (already [lat,lng])
      routePoints = osrmRoute;
    } else if (pickupLatLng && dropoffLatLng) {
      // Last resort: straight line
      routePoints = [pickupLatLng, dropoffLatLng];
    }

    if (routePoints.length > 0) {
      // Signature Google Navigation Colors
      const isEnRoute = rideStatus === 'in_progress';
      const isFinding = rideStatus === 'finding_driver' || !rideStatus;

      // 1. Google Route Casing / Halo (makes route pop against streets & buildings)
      if (!polylineBorderRef.current) {
        polylineBorderRef.current = L.polyline(routePoints, {
          color: '#ffffff',
          weight: 9,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      } else {
        polylineBorderRef.current.setLatLngs(routePoints);
      }

      // 2. Google Route Primary Core Polyline (#4285F4 signature Google navigation blue)
      const coreColor = isEnRoute ? '#1a73e8' : isFinding ? '#4285f4' : '#188038';
      if (!polylineCoreRef.current) {
        polylineCoreRef.current = L.polyline(routePoints, {
          color: coreColor,
          weight: 5.5,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: isFinding ? '8, 12' : undefined,
        }).addTo(map);
      } else {
        polylineCoreRef.current.setLatLngs(routePoints);
        polylineCoreRef.current.setStyle({
          color: coreColor,
          dashArray: isFinding ? '8, 12' : undefined,
        });
      }

      routePoints.forEach((p) => bounds.extend(p));
    }

    // Auto-fit bounds smoothly with gentle padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [70, 40],
        paddingBottomRight: [50, 40],
        maxZoom: 16,
        animate: true,
        duration: 0.8,
      });
    }
  }, [pickupLatLng, dropoffLatLng, driverLatLng, routeGeometry, osrmRoute, mapReady, rideStatus, parseCoordinates]);

  // ─── Control Actions ────────────────────────────────────────────────
  const fitRouteBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const b = L.latLngBounds([]);
    if (pickupLatLng)  b.extend(pickupLatLng);
    if (dropoffLatLng) b.extend(dropoffLatLng);
    if (driverLatLng)  b.extend(driverLatLng);
    if (b.isValid()) {
      map.fitBounds(b, {
        paddingTopLeft: [70, 40],
        paddingBottomRight: [50, 40],
        maxZoom: 16,
        animate: true,
        duration: 0.8,
      });
    }
  };

  const centerOnDriver = () => {
    const map = mapInstanceRef.current;
    if (map && driverLatLng) {
      map.setView(driverLatLng, 17, { animate: true, duration: 0.8 });
    }
  };

  const centerOnPickup = () => {
    const map = mapInstanceRef.current;
    if (map && pickupLatLng) {
      map.setView(pickupLatLng, 16, { animate: true, duration: 0.8 });
    }
  };

  const resetNorth = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (pickupLatLng) {
      map.panTo(pickupLatLng, { animate: true });
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const zoomIn = () => mapInstanceRef.current?.zoomIn(1);
  const zoomOut = () => mapInstanceRef.current?.zoomOut(1);

  const statusConfig = STATUS_LABELS[rideStatus] || {
    text: 'Udaipur City Navigation',
    color: '#1a73e8',
    bg: '#e8f0fe',
    badge: 'Live',
  };

  return (
    <div
      ref={containerRef}
      className={`gm-map-root relative w-full overflow-hidden select-none ${className}`}
      style={{
        height: isFullscreen ? '100vh' : height,
        borderRadius: isFullscreen ? '0px' : '16px',
        backgroundColor: '#e5e3df', // Classic Google Maps background canvas color
        boxShadow: isFullscreen ? 'none' : '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
        border: isFullscreen ? 'none' : '1px solid rgba(226, 232, 240, 0.9)',
      }}
    >
      {/* Map Target Canvas */}
      <div ref={mapElementRef} className="w-full h-full z-0" />

      {/* ─── Top-Left: Google Maps Floating Navigation Card ─────────── */}
      <div className="absolute top-3.5 left-3.5 z-[400] max-w-[calc(100%-80px)] sm:max-w-md pointer-events-none">
        <div
          className="pointer-events-auto rounded-2xl p-3 flex flex-col gap-2 transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(60, 64, 67, 0.28), 0 0 0 1px rgba(60, 64, 67, 0.08)',
          }}
        >
          {/* Top Row: Trip Status & Mode */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ background: statusConfig.color }}
              />
              <span
                className="text-xs font-semibold tracking-tight"
                style={{ color: '#202124', fontFamily: 'Roboto, sans-serif' }}
              >
                {statusConfig.text}
              </span>
            </div>

            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: statusConfig.color,
                background: statusConfig.bg,
              }}
            >
              {statusConfig.badge}
            </span>
          </div>

          {/* Bottom Row: Large Google ETA & Distance */}
          {(etaMinutes || distanceKm) && (
            <div className="flex items-baseline gap-3 pt-1 border-t border-slate-100">
              {etaMinutes && (
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-xl font-extrabold tracking-tight"
                    style={{ color: '#188038', fontFamily: 'Roboto, sans-serif' }}
                  >
                    {etaMinutes}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">min</span>
                </div>
              )}

              {etaMinutes && distanceKm && (
                <span className="text-slate-300 font-bold">·</span>
              )}

              {distanceKm && (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-slate-700">{distanceKm}</span>
                  <span className="text-xs text-slate-500 font-medium">km</span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Fastest route</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Top-Right & Middle-Right: Google Maps Floating Action Stack ─── */}
      {showControls && (
        <div className="absolute top-3.5 right-3.5 z-[400] flex flex-col gap-2.5 items-end">
          {/* Layer Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu((prev) => !prev)}
              title="Map Layers"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 group"
              style={{
                background: '#ffffff',
                boxShadow: '0 2px 6px rgba(60,64,67,0.3), 0 0 0 1px rgba(60,64,67,0.08)',
              }}
            >
              <Layers className="w-5 h-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
            </button>

            {/* Layer Popup Menu */}
            {showLayerMenu && (
              <div
                className="absolute right-0 top-12 w-64 rounded-2xl p-2 z-50 animate-fadeIn"
                style={{
                  background: '#ffffff',
                  boxShadow: '0 8px 28px rgba(60,64,67,0.28), 0 0 0 1px rgba(60,64,67,0.08)',
                }}
              >
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Map Type
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">Google Tiles</span>
                </div>

                <div className="py-1 space-y-1">
                  {Object.entries(TILE_LAYERS).map(([key, cfg]) => {
                    const isSelected = activeLayer === key && !isTrafficActive;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setActiveLayer(key);
                          setIsTrafficActive(false);
                          setShowLayerMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-base">{cfg.icon}</span>
                        <div className="flex-1">
                          <div className="text-xs font-semibold">{cfg.label}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{cfg.description}</div>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Traffic Toggle Chip */}
                <div className="pt-2 border-t border-slate-100 px-2 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrafficActive((prev) => !prev);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full py-1.5 px-3 rounded-xl flex items-center justify-between text-xs font-semibold transition-all ${
                      isTrafficActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Activity className={`w-3.5 h-3.5 ${isTrafficActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      Live Traffic Flow
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isTrafficActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isTrafficActive ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Live Traffic Toggle Button */}
          <button
            type="button"
            onClick={() => setIsTrafficActive((prev) => !prev)}
            title={isTrafficActive ? 'Hide Live Traffic' : 'Show Live Traffic'}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: isTrafficActive ? '#e6f4ea' : '#ffffff',
              boxShadow: '0 2px 6px rgba(60,64,67,0.3), 0 0 0 1px rgba(60,64,67,0.08)',
              border: isTrafficActive ? '1.5px solid #34a853' : 'none',
            }}
          >
            <Activity className={`w-5 h-5 ${isTrafficActive ? 'text-emerald-600' : 'text-slate-700'}`} />
          </button>

          {/* Recenter & Fit Route */}
          <button
            type="button"
            onClick={fitRouteBounds}
            title="Fit Entire Route"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 group"
            style={{
              background: '#ffffff',
              boxShadow: '0 2px 6px rgba(60,64,67,0.3), 0 0 0 1px rgba(60,64,67,0.08)',
            }}
          >
            <Compass className="w-5 h-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
          </button>

          {/* Focus Live Driver (If Available) */}
          {driverLatLng && (
            <button
              type="button"
              onClick={centerOnDriver}
              title="Track Live Driver"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 group"
              style={{
                background: 'linear-gradient(135deg, #1a73e8, #4285f4)',
                boxShadow: '0 3px 8px rgba(26,115,232,0.4), 0 0 0 1px rgba(26,115,232,0.2)',
              }}
            >
              <Car className="w-5 h-5 text-white animate-pulse" />
            </button>
          )}

          {/* Focus Pickup Location */}
          {pickupLatLng && !driverLatLng && (
            <button
              type="button"
              onClick={centerOnPickup}
              title="Center on Pickup Location"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 group"
              style={{
                background: '#ffffff',
                boxShadow: '0 2px 6px rgba(60,64,67,0.3), 0 0 0 1px rgba(60,64,67,0.08)',
              }}
            >
              <Locate className="w-5 h-5 text-slate-700 group-hover:text-emerald-600 transition-colors" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 group"
            style={{
              background: '#ffffff',
              boxShadow: '0 2px 6px rgba(60,64,67,0.3), 0 0 0 1px rgba(60,64,67,0.08)',
            }}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-slate-700 group-hover:text-blue-600" />
            ) : (
              <Maximize2 className="w-5 h-5 text-slate-700 group-hover:text-blue-600" />
            )}
          </button>

          {/* Google Maps Authentic Zoom Widget (+ / −) */}
          <div
            className="flex flex-col rounded-xl overflow-hidden"
            style={{
              boxShadow: '0 2px 6px rgba(60,64,67,0.3), 0 0 0 1px rgba(60,64,67,0.08)',
              background: '#ffffff',
            }}
          >
            <button
              type="button"
              onClick={zoomIn}
              title="Zoom in"
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 transition-colors border-b border-slate-100 active:bg-slate-100"
            >
              <Plus className="w-5 h-5 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              title="Zoom out"
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 transition-colors active:bg-slate-100"
            >
              <Minus className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Bottom-Left: Subtle Route Indicators & Legend ──────────── */}
      <div
        className="absolute bottom-6 left-3.5 z-[400] flex items-center gap-3 pointer-events-none px-3.5 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 6px rgba(60, 64, 67, 0.25)',
          color: '#3c4043',
        }}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]"></span>
          <span>Pickup</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]"></span>
          <span>Destination</span>
        </span>
        {driverLatLng && (
          <>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]"></span>
              <span>Driver</span>
            </span>
          </>
        )}
      </div>

      {/* ─── Google Maps Styling Injections ─────────────────────────── */}
      <style>{`
        /* Pin Drop Keyframe Animation */
        @keyframes gmPinDrop {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.8);
          }
          60% {
            opacity: 1;
            transform: translateY(2px) scale(1.04);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }

        /* Navigation Puck Pulse */
        @keyframes gmPuckPulse {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          70% {
            transform: scale(2.2);
            opacity: 0;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* Leaflet Container overrides for Google Maps polish */
        .gm-map-root .leaflet-container {
          font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          background: #e5e3df !important;
        }

        /* Clean Google-style Popups */
        .gm-style-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 16px rgba(60, 64, 67, 0.28), 0 0 0 1px rgba(60, 64, 67, 0.08) !important;
          border: none !important;
          background: #ffffff !important;
        }

        .gm-style-popup .leaflet-popup-tip-container {
          display: none !important;
        }

        .gm-style-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: normal !important;
        }

        /* Scale Bar Styling (Google style) */
        .gm-map-root .leaflet-control-scale-line {
          border: 1.5px solid rgba(60, 64, 67, 0.7) !important;
          border-top: none !important;
          color: #3c4043 !important;
          font-size: 10px !important;
          font-weight: 500 !important;
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(4px) !important;
          padding: 1px 4px !important;
          border-radius: 0 0 3px 3px !important;
          letter-spacing: 0.1px;
        }

        /* Clean attribution watermark */
        .gm-map-root .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(4px) !important;
          padding: 2px 6px !important;
          border-radius: 4px 0 0 0 !important;
          margin: 0 !important;
        }
      `}</style>
    </div>
  );
}
