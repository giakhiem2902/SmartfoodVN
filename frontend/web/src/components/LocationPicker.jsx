import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, message, Input, Empty } from 'antd';
import { EnvironmentOutlined, ClearOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import '../styles/LocationPicker.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component để xử lý click trên map
const MapClickHandler = ({ onMapClick }) => {
  useMapEvent('click', (e) => {
    onMapClick(e.latlng);
  });
  return null;
};

// Component để center map
const MapCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 16);
    }
  }, [center, map]);
  return null;
};

const LocationPicker = ({ visible, onClose, onConfirm, initialLocation, initialAddress }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress || '');
  const [mapCenter, setMapCenter] = useState(initialLocation || { lat: 10.8231, lng: 106.6841 });
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setMapCenter(initialLocation);
    }
  }, [initialLocation, visible]);

  // Reverse geocode để lấy địa chỉ từ tọa độ
  const getAddressFromCoords = async (lat, lng) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`,
        { headers: { 'User-Agent': 'SmartFood-App' } }
      );
      
      if (!response.ok) throw new Error('Nominatim error');
      
      const data = await response.json();
      const address = data.address || {};
      let addressParts = [];
      
      if (address.road) addressParts.push(address.road);
      else if (address.pedestrian) addressParts.push(address.pedestrian);
      
      if (address.suburb) addressParts.push(address.suburb);
      else if (address.district) addressParts.push(address.district);
      
      if (address.city) addressParts.push(address.city);
      
      const addressStr = addressParts.filter(Boolean).join(', ');
      setSelectedAddress(addressStr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (err) {
      console.error('Geocoding error:', err);
      setSelectedAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
    getAddressFromCoords(latlng.lat, latlng.lng);
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      message.warning('Vui lòng chọn vị trí trên bản đồ');
      return;
    }
    onConfirm(selectedLocation, selectedAddress);
    onClose();
  };

  const handleReset = () => {
    setSelectedLocation(null);
    setSelectedAddress('');
    setSearchAddress('');
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) {
      message.warning('Vui lòng nhập địa chỉ cần tìm');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&accept-language=vi`,
        { headers: { 'User-Agent': 'SmartFood-App' } }
      );
      
      if (!response.ok) throw new Error('Search error');
      
      const data = await response.json();
      if (data.length === 0) {
        message.warning('Không tìm thấy địa chỉ');
        return;
      }

      const result = data[0];
      const newLocation = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
      setSelectedLocation(newLocation);
      setMapCenter(newLocation);
      setSelectedAddress(result.display_name);
      message.success('Tìm thấy địa chỉ!');
    } catch (err) {
      console.error('Search error:', err);
      message.error('Không thể tìm kiếm địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chọn vị trí giao hàng"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="back" onClick={onClose}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleConfirm}
          loading={loading}
          style={{ background: '#ff6b35' }}
        >
          Xác nhận vị trí
        </Button>,
      ]}
      styles={{ body: { padding: '16px' } }}
    >
      <div className="location-picker-container">
        {/* SEARCH BOX */}
        <div className="location-search-box">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Tìm kiếm địa chỉ... (vd: Phạm Văn Đồng, Thủ Đức)"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onPressEnter={handleSearchAddress}
              prefix={<EnvironmentOutlined />}
            />
            <Button 
              type="primary" 
              onClick={handleSearchAddress}
              loading={loading}
              style={{ background: '#ff6b35' }}
            >
              Tìm
            </Button>
          </Space.Compact>
        </div>

        {/* MAP */}
        <div className="location-map">
          {mapCenter && (
            <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={15} scrollWheelZoom={true}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <MapCenter center={mapCenter} />
              <MapClickHandler onMapClick={handleMapClick} />
              
              {selectedLocation && (
                <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                  <Popup>
                    <div style={{ maxWidth: 200 }}>
                      <strong>Vị trí được chọn</strong>
                      <p style={{ margin: '8px 0 0 0', fontSize: 12 }}>
                        {selectedAddress}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          )}
        </div>

        {/* SELECTED ADDRESS */}
        <div className="location-result">
          <div className="result-header">
            <EnvironmentOutlined style={{ marginRight: 8, color: '#ff6b35' }} />
            <span style={{ fontWeight: 600 }}>Vị trí đã chọn:</span>
          </div>
          {selectedLocation ? (
            <div className="result-content">
              <div className="result-address">
                <span>{selectedAddress}</span>
              </div>
              <div className="result-coords">
                Tọa độ: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
              </div>
              <Button 
                type="text" 
                danger 
                size="small"
                icon={<ClearOutlined />}
                onClick={handleReset}
              >
                Chọn lại
              </Button>
            </div>
          ) : (
            <Empty 
              description="Chưa chọn vị trí"
              style={{ marginTop: 12 }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>

        {/* HINT */}
        <div className="location-hint">
          💡 <strong>Hướng dẫn:</strong> Click trực tiếp trên bản đồ để chọn vị trí, hoặc tìm kiếm địa chỉ ở trên
        </div>
      </div>
    </Modal>
  );
};

export default LocationPicker;
