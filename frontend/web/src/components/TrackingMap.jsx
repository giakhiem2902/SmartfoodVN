import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const TrackingMap = ({ driverPos, storePos, userPos }) => {
  const [mapCenter, setMapCenter] = useState(userPos || [21.0285, 105.8542]); // Hanoi default

  useEffect(() => {
    if (userPos) {
      setMapCenter([userPos.lat, userPos.lng]);
    }
  }, [userPos]);

  const storeMarkerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const driverMarkerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const userMarkerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Create polyline points
  const polylinePoints = [];
  if (driverPos) polylinePoints.push([driverPos.lat, driverPos.lng]);
  if (storePos) polylinePoints.push([storePos.lat, storePos.lng]);
  if (userPos) polylinePoints.push([userPos.lat, userPos.lng]);

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {storePos && (
        <Marker position={[storePos.lat, storePos.lng]} icon={storeMarkerIcon}>
          <Popup>Cửa hàng: {storePos.name}</Popup>
        </Marker>
      )}

      {driverPos && (
        <Marker position={[driverPos.lat, driverPos.lng]} icon={driverMarkerIcon}>
          <Popup>Tài xế đang giao hàng</Popup>
        </Marker>
      )}

      {userPos && (
        <Marker position={[userPos.lat, userPos.lng]} icon={userMarkerIcon}>
          <Popup>Vị trí nhận hàng</Popup>
        </Marker>
      )}

      {polylinePoints.length > 1 && (
        <Polyline positions={polylinePoints} color="blue" weight={2} />
      )}
    </MapContainer>
  );
};

export default TrackingMap;
