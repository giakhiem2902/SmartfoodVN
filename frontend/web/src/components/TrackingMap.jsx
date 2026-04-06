import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Function to encode SVG to Base64 (UTF-8 safe)
const encodeBase64 = (str) => {
  return btoa(unescape(encodeURIComponent(str)));
};

// Custom SVG icons
const createCustomIcon = (color, emoji) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="20" y="26" font-size="22" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>
  `;
  
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${encodeBase64(svg)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const TrackingMap = ({ driverPos, storePos, userPos }) => {
  const [mapCenter, setMapCenter] = useState(userPos || [21.0285, 105.8542]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userPos) {
      setMapCenter([userPos.lat, userPos.lng]);
    }
  }, [userPos]);

  // Fetch route from OSRM API
  useEffect(() => {
    const fetchRoute = async () => {
      if (!storePos || !userPos) return;
      
      try {
        setLoading(true);
        const startPos = driverPos || storePos;
        
        const url = `https://router.project-osrm.org/route/v1/driving/${startPos.lng},${startPos.lat};${userPos.lng},${userPos.lat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteCoordinates(coords);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        const startPos = driverPos || storePos;
        setRouteCoordinates([
          [startPos.lat, startPos.lng],
          [userPos.lat, userPos.lng]
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [driverPos, storePos, userPos]);

  // Custom icons
  const storeIcon = createCustomIcon('#ff6b6b', '🏪');
  const driverIcon = createCustomIcon('#4dabf7', '🚚');
  const userIcon = createCustomIcon('#51cf66', '📍');

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: '450px', width: '100%', borderRadius: '4px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Store marker */}
      {storePos && (
        <>
          <Marker position={[storePos.lat, storePos.lng]} icon={storeIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>🏪 Cửa hàng</strong><br />
                <span>{storePos.name}</span>
              </div>
            </Popup>
          </Marker>
          {/* Glow effect */}
          <CircleMarker
            center={[storePos.lat, storePos.lng]}
            radius={25}
            fill
            fillColor="#ff6b6b"
            fillOpacity={0.1}
            stroke={true}
            color="#ff6b6b"
            weight={2}
            opacity={0.3}
            dashArray="5"
          />
        </>
      )}

      {/* Driver marker */}
      {driverPos && (
        <>
          <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>🚚 Tài xế đang giao hàng</strong><br />
                <span>Vị trí hiện tại</span>
              </div>
            </Popup>
          </Marker>
          {/* Glow effect */}
          <CircleMarker
            center={[driverPos.lat, driverPos.lng]}
            radius={20}
            fill
            fillColor="#4dabf7"
            fillOpacity={0.15}
            stroke={true}
            color="#4dabf7"
            weight={2}
            opacity={0.4}
            dashArray="3"
          />
        </>
      )}

      {/* User/Delivery marker */}
      {userPos && (
        <>
          <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>📍 Vị trí nhận hàng</strong><br />
                <span>Điểm đến</span>
              </div>
            </Popup>
          </Marker>
          {/* Glow effect */}
          <CircleMarker
            center={[userPos.lat, userPos.lng]}
            radius={25}
            fill
            fillColor="#51cf66"
            fillOpacity={0.12}
            stroke={true}
            color="#51cf66"
            weight={2}
            opacity={0.35}
            dashArray="5"
          />
        </>
      )}

      {/* Route polyline - thực tế hoặc đường thẳng */}
      {routeCoordinates.length > 1 && (
        <>
          {/* Base layer - shadow effect */}
          <Polyline 
            positions={routeCoordinates} 
            color="#000000" 
            weight={5}
            opacity={0.1}
          />
          {/* Main route - bright blue */}
          <Polyline 
            positions={routeCoordinates} 
            color="#1890ff" 
            weight={3}
            opacity={0.9}
          />
          {/* Top highlight - lighter blue */}
          <Polyline 
            positions={routeCoordinates} 
            color="#69b1ff" 
            weight={1}
            opacity={0.6}
            dashArray="2"
          />
        </>
      )}
    </MapContainer>
  );
};

export default TrackingMap;
