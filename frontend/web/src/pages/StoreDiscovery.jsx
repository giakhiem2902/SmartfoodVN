import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Input, Row, Col, Tag, Spin, Empty,
  Typography, Button, Drawer, Space, message, Badge,
} from 'antd';
import {
  EnvironmentOutlined, SearchOutlined, ClockCircleOutlined,
  ShopOutlined, RightOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useLocationStore } from '../store/useStore';
import apiClient from '../services/apiClient';
import BootstrapIcon from '../components/BootstrapIcon';
import L from 'leaflet';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons using Bootstrap Icons style
const createUserIcon = () => L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA0OCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48c3R5bGU+LnNoYWRvdyB7IGZpbHRlcjogZHJvcC1zaGFkb3coMCAxMHB4IDIwcHggcmdiYSgwLDAsMCwwLjMpKTsgfTwvc3R5bGU+PC9kZWZzPjwhLS0gU2hhZG93IC0tPjxjaXJjbGUgY3g9IjI0IiBjeT0iNTAiIHI9IjE0IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMSkiIGNsYXNzPSJzaGFkb3ciLz48IS0tIE1haW4gY2lyY2xlIGJhY2tncm91bmQgLS0+PGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMTgiIGZpbGw9IiMyMTk2ZjMiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwhLS0gVXNlciBpY29uIC0tPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI0LCAyNCkiPjwhLS0gSGVhZCAtLT48Y2lyY2xlIGN4PSIwIiBjeT0iLTYiIHI9IjUiIGZpbGw9IndoaXRlIi8+PCEtLSBCb2R5IC0tPjxwYXRoIGQ9Ik0tNiAyIEwtMyA4IEwzIDggTDYgMiBRMCA0IC0zIDIgUS0zIDIgLTYgMloiIGZpbGw9IndoaXRlIi8+PC9nPjwvc3ZnPg==',
  iconSize: [48, 60],
  iconAnchor: [24, 60],
  popupAnchor: [0, -60],
  shadowSize: [0, 0],
});

const createStoreIcon = () => L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA0OCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48c3R5bGU+LnNoYWRvdyB7IGZpbHRlcjogZHJvcC1zaGFkb3coMCAxMHB4IDIwcHggcmdiYSgwLDAsMCwwLjMpKTsgfTwvc3R5bGU+PC9kZWZzPjwhLS0gU2hhZG93IC0tPjxjaXJjbGUgY3g9IjI0IiBjeT0iNTAiIHI9IjE0IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMSkiIGNsYXNzPSJzaGFkb3ciLz48IS0tIE1haW4gY2hvcyBiYWNrZ3JvdW5kIC0tPjxwYXRoIGQ9Ik0xMiA1MkM4IDUyIDYgNTAgNiA0N1YyMEM2IDE1IDEwIDEwIDE0IDEwSDE0VjhDMTQgNiAxNiA0IDE4IDRIMzBDMzIgNCAzNCA2IDM0IDhWMTBIMzRDMzggMTAgNDIgMTUgNDIgMjBWNDdDNDIgNTAgNDAgNTIgMzYgNTJIMTJaIiBmaWxsPSIjZmY2YjM1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48IS0tIFdpbmRvdyAtLT48cmVjdCB4PSIxNCIgeT0iMjAiIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjI2IiB5PSIyMCIgd2lkdGg9IjgiIGhlaWdodD0iMTAiIGZpbGw9IndoaXRlIi8+PCEtLSBEb29yIC0tPjxyZWN0IHg9IjIwIiB5PSIzNiIgd2lkdGg9IjgiIGhlaWdodD0iMTIiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
  iconSize: [48, 60],
  iconAnchor: [24, 60],
  popupAnchor: [0, -60],
  shadowSize: [0, 0],
});

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const isStoreOpen = (opening, closing) => {
  if (!opening || !closing) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = opening.split(':').map(Number);
  const [ch, cm] = closing.split(':').map(Number);
  return cur >= oh * 60 + om && cur <= ch * 60 + cm;
};

const StoreDiscovery = ({ token, userLocation }) => {
  const navigate = useNavigate();
  const { userAddress } = useLocationStore();

  const [stores, setStores] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchNearbyStores = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const res = await apiClient.getNearbyStores(userLocation.lat, userLocation.lng, 20);
      const data = Array.isArray(res) ? res : (res.data || []);
      setStores(data);
      setFiltered(data);
    } catch (err) {
      message.error('Không thể tải danh sách quán ăn');
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchNearbyStores();
  }, [fetchNearbyStores]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(stores);
    } else {
      const q = search.toLowerCase();
      setFiltered(stores.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
      ));
    }
  }, [search, stores]);

  const openDrawer = (store) => {
    setSelectedStore(store);
    setDrawerOpen(true);
  };

  const getImageSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '🌅 Chào buổi sáng' : hour < 18 ? '☀️ Chào buổi chiều' : '🌙 Chào buổi tối';

  const mapCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [10.856, 106.774];

  if (!userLocation) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>📍</div>
        <Title level={4} style={{ margin: 0 }}>Vui lòng bật định vị</Title>
        <Text type="secondary">Ứng dụng cần vị trí của bạn để tìm quán ăn gần nhất</Text>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      {/* HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7a86e 100%)',
        padding: '36px 24px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -80, top: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute', right: 60, top: 60,
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative' }}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>
            {greeting.includes('sáng') ? (
              <BootstrapIcon icon="sunrise" size={16} color="#fff" style={{ marginRight: 6 }} />
            ) : greeting.includes('chiều') ? (
              <BootstrapIcon icon="sun" size={16} color="#fff" style={{ marginRight: 6 }} />
            ) : (
              <BootstrapIcon icon="moon-stars" size={16} color="#fff" style={{ marginRight: 6 }} />
            )}
            {greeting.replace(/^🌅|☀️|🌙\s+/, '')}
            <BootstrapIcon icon="hand-thumbs-up" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </Text>
          <Title level={2} style={{ color: 'white', margin: '6px 0 4px', fontSize: 26 }}>
            Bạn muốn ăn gì hôm nay?
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>
            {stores.length > 0
              ? `Tìm thấy ${stores.length} quán ăn gần bạn trong vòng 20km`
              : 'Đang tìm quán ăn gần bạn...'}
          </Paragraph>
          <Search
            placeholder="Tìm tên quán, địa chỉ..."
            size="large"
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 580, borderRadius: 12 }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '-20px auto 0', padding: '0 16px 40px', position: 'relative', zIndex: 1 }}>

        {/* QUICK STATS */}
        <Row gutter={12} style={{ marginBottom: 24 }}>
          {[
            { icon: 'shop', label: 'Quán gần bạn', value: stores.length, color: '#ff6b35' },
            { icon: 'check-circle-fill', label: 'Đang mở cửa', value: stores.filter(s => isStoreOpen(s.opening_time, s.closing_time)).length, color: '#52c41a' },
            { icon: 'map', label: 'Bán kính tìm kiếm', value: '20 km', color: '#1890ff' },
          ].map((stat, i) => (
            <Col span={8} key={i}>
              <Card size="small" style={{ borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}>
                <BootstrapIcon icon={stat.icon} size={28} color={stat.color} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{stat.label}</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* STORE GRID */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Title level={4} style={{ margin: 0 }}>
            <BootstrapIcon icon="shop" size={20} color="#ff6b35" style={{ marginRight: 8 }} />
            Quán ăn gần bạn
          </Title>
          <Button icon={<ReloadOutlined />} onClick={fetchNearbyStores} loading={loading} size="small" type="text">
            Làm mới
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large">
              <div style={{ minHeight: 40 }} />
            </Spin>
            <div style={{ marginTop: 12, color: '#666' }}>Đang tìm quán ăn...</div>
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            description={search ? `Không tìm thấy quán nào với "${search}"` : 'Không có quán ăn nào gần bạn'}
            style={{ padding: 60 }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map(store => {
              const open = isStoreOpen(store.opening_time, store.closing_time);
              const imgSrc = getImageSrc(store.image_url);
              return (
                <Col xs={24} sm={12} lg={8} key={store.id}>
                  <Card
                    hoverable
                    onClick={() => openDrawer(store)}
                    style={{
                      borderRadius: 16, overflow: 'hidden', border: 'none',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
                      opacity: open ? 1 : 0.72,
                    }}
                    cover={
                      <div style={{ position: 'relative', height: 175, background: '#f0ebe4', overflow: 'hidden' }}>
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={store.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{
                            height: '100%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 52,
                            background: 'linear-gradient(135deg, #ffe4cc, #ffd0a8)',
                          }}>🍽️</div>
                        )}
                        {/* Open/Close badge */}
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          background: open ? '#52c41a' : '#ff4d4f',
                          color: 'white', borderRadius: 20,
                          padding: '2px 10px', fontSize: 11, fontWeight: 600,
                        }}>
                          {open ? '🟢 Mở cửa' : '🔴 Đóng cửa'}
                        </div>
                        {/* Distance badge */}
                        <div style={{
                          position: 'absolute', bottom: 10, left: 10,
                          background: 'rgba(0,0,0,0.55)',
                          color: 'white', borderRadius: 20,
                          padding: '2px 10px', fontSize: 12,
                        }}>
                          📍 {store.distance_km?.toFixed(1)} km
                        </div>
                      </div>
                    }
                    styles={{ body: { padding: '12px 14px' } }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>
                      {store.name}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
                      <EnvironmentOutlined style={{ marginRight: 3 }} />
                      {store.address}
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {store.opening_time ? (
                        <Tag icon={<ClockCircleOutlined />} color="default" style={{ fontSize: 11, margin: 0 }}>
                          {store.opening_time.slice(0, 5)} – {store.closing_time?.slice(0, 5)}
                        </Tag>
                      ) : <span />}
                      <Button
                        type="primary"
                        size="small"
                        icon={<RightOutlined />}
                        style={{ background: '#ff6b35', borderColor: '#ff6b35', borderRadius: 20, fontSize: 12 }}
                        onClick={e => { e.stopPropagation(); navigate(`/store/${store.id}`); }}
                      >
                        Xem menu
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* MAP */}
        {stores.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <Title level={4} style={{ marginBottom: 14 }}>
              <BootstrapIcon icon="map" size={20} color="#ff6b35" style={{ marginRight: 8 }} />
              Bản đồ khu vực
            </Title>
            <Card style={{ borderRadius: 16, overflow: 'hidden', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} styles={{ body: { padding: 0 } }}>
              <MapContainer center={mapCenter} zoom={14} style={{ height: 380, width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={mapCenter} icon={createUserIcon()}>
                  <Popup>
                    <div style={{ textAlign: 'center', minWidth: 200 }}>
                      <BootstrapIcon icon="geo-alt-fill" size={16} color="#2196f3" style={{ marginRight: 6 }} />
                      <strong style={{ color: '#2196f3' }}>Vị trí của bạn</strong>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 6, lineHeight: 1.4, textAlign: 'left' }}>
                        <strong>Địa chỉ:</strong> {userAddress}
                      </div>
                    </div>
                  </Popup>
                </Marker>
                {filtered.map(store => (
                  <Marker key={store.id} position={[store.lat, store.lng]} icon={createStoreIcon()}>
                    <Popup>
                      <strong style={{ color: '#ff6b35' }}>{store.name}</strong><br />
                      {store.address}<br />
                      <span
                        style={{ color: '#ff6b35', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => openDrawer(store)}
                      >
                        Xem chi tiết →
                      </span>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card>
          </div>
        )}
      </div>

      {/* STORE DETAIL DRAWER */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={400}
        title={null}
        styles={{ body: { padding: 0 } }}
      >
        {selectedStore && (() => {
          const open = isStoreOpen(selectedStore.opening_time, selectedStore.closing_time);
          const imgSrc = getImageSrc(selectedStore.image_url);
          return (
            <div>
              <div style={{ height: 210, overflow: 'hidden', background: '#f0ebe4' }}>
                {imgSrc ? (
                  <img src={imgSrc} alt={selectedStore.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    height: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 72,
                    background: 'linear-gradient(135deg, #ffe4cc, #ffd0a8)',
                  }}>🍽️</div>
                )}
              </div>
              <div style={{ padding: '20px 22px' }}>
                <Space style={{ marginBottom: 10 }}>
                  <Tag color={open ? 'success' : 'error'}>{open ? '🟢 Đang mở cửa' : '🔴 Đã đóng cửa'}</Tag>
                  <Tag color="orange">📍 {selectedStore.distance_km?.toFixed(1)} km</Tag>
                </Space>
                <Title level={3} style={{ margin: '0 0 12px' }}>{selectedStore.name}</Title>
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text type="secondary"><EnvironmentOutlined style={{ marginRight: 6 }} />{selectedStore.address}</Text>
                  {selectedStore.phone && <Text type="secondary">📞 {selectedStore.phone}</Text>}
                  {selectedStore.opening_time && (
                    <Text type="secondary">
                      <ClockCircleOutlined style={{ marginRight: 6 }} />
                      {selectedStore.opening_time.slice(0, 5)} – {selectedStore.closing_time?.slice(0, 5)}
                    </Text>
                  )}
                  {selectedStore.description && (
                    <Paragraph type="secondary" style={{ margin: '8px 0 0', fontSize: 13 }}>
                      {selectedStore.description}
                    </Paragraph>
                  )}
                </Space>
                <Button
                  type="primary"
                  block
                  size="large"
                  style={{
                    marginTop: 22,
                    background: '#ff6b35',
                    borderColor: '#ff6b35',
                    borderRadius: 12,
                    height: 46,
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                  onClick={() => { setDrawerOpen(false); navigate(`/store/${selectedStore.id}`); }}
                >
                  🛒 Xem thực đơn & Đặt món
                </Button>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
};

export default StoreDiscovery;
