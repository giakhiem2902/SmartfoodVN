/**
 * OsmMap – bản đồ OSM dùng Leaflet.js bên trong WebView
 * Không cần Google Maps API key, chạy tốt trên mọi Android/iOS.
 *
 * Props:
 *  region      : { latitude, longitude, latitudeDelta, longitudeDelta }
 *  markers     : [{ id, coordinate: { latitude, longitude }, title, color }]
 *  route       : [{ coords: [{latitude, longitude}], color: string, weight?: number }]
 *                Mỗi phần tử là 1 đoạn đường (segment). VD: driver→store, store→user
 *  style       : ViewStyle
 *  onReady     : () => void  (gọi khi map load xong)
 *  webViewRef  : ref để gọi injectJavaScript từ ngoài (cập nhật driver marker real-time)
 */
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// ─── Tạo HTML ban đầu ────────────────────────────────────────────────────────
const buildHtml = (region, markers = [], route = []) => {
  const lat = region?.latitude ?? 10.8231;
  const lng = region?.longitude ?? 106.6297;
  const zoom = region?.latitudeDelta
    ? Math.min(18, Math.max(10, Math.round(Math.log2(360 / region.latitudeDelta))))
    : 13;

  const markersJson = JSON.stringify(
    markers.map((m) => ({
      id: String(m.id),
      lat: m.coordinate?.latitude,
      lng: m.coordinate?.longitude,
      title: m.title ?? '',
      color: m.color ?? '#E53935',
      type: m.type ?? (m.id === 'driver' ? 'driver' : 'store'),
      isDriver: m.id === 'driver',
    }))
  );

  // Chuyển route segments thành format Leaflet polyline
  const routeJson = JSON.stringify(
    route.map((seg) => ({
      coords: (seg.coords || []).map((c) => [c.latitude, c.longitude]),
      color: seg.color ?? '#1565C0',
      weight: seg.weight ?? 5,
      opacity: seg.opacity ?? 0.85,
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin:0; padding:0; width:100%; height:100%; background:#e8e0d8; }
    .driver-icon { animation: pulse 1.5s infinite; }
    @keyframes pulse {
      0%   { transform: scale(1);   opacity:1; }
      50%  { transform: scale(1.25); opacity:0.7; }
      100% { transform: scale(1);   opacity:1; }
    }
    .marker-emoji {
      display: flex; align-items: center; justify-content: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));
      line-height: 1;
    }
    .driver-pulse { animation: pulse 1.5s infinite; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    /* ── Init map ── */
    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    /* ── Helper: tạo icon emoji theo loại marker ── */
    function makeEmojiIcon(type, isDriver) {
      var emoji, size, cssClass;
      if (type === 'driver' || isDriver) {
        emoji = '🛵'; size = 34; cssClass = 'marker-emoji driver-pulse';
      } else if (type === 'store') {
        emoji = '🏪'; size = 30; cssClass = 'marker-emoji';
      } else if (type === 'destination' || type === 'user') {
        emoji = '📍'; size = 32; cssClass = 'marker-emoji';
      } else {
        emoji = '📍'; size = 30; cssClass = 'marker-emoji';
      }
      var html = '<div class="' + cssClass + '" style="font-size:' + size + 'px;width:' + size + 'px;height:' + size + 'px;">' + emoji + '</div>';
      return L.divIcon({ className: '', html: html, iconSize: [size, size], iconAnchor: [size/2, size] });
    }

    /* ── Thêm markers ── */
    var markersData = ${markersJson};
    var markerMap   = {};
    var allLatLngs  = [];

    markersData.forEach(function(m) {
      if (m.lat == null || m.lng == null) return;
      var ll   = [m.lat, m.lng];
      var icon = makeEmojiIcon(m.type, m.isDriver);
      var lm   = L.marker(ll, { icon: icon }).addTo(map).bindPopup(m.title || '');
      markerMap[m.id] = lm;
      allLatLngs.push(ll);
    });

    /* ── Vẽ route segments ── */
    var routeData    = ${routeJson};
    var routeLayers  = [];
    var routeLatLngs = [];

    routeData.forEach(function(seg) {
      if (!seg.coords || seg.coords.length < 2) return;
      var pl = L.polyline(seg.coords, {
        color:   seg.color,
        weight:  seg.weight,
        opacity: seg.opacity,
        lineJoin: 'round',
        lineCap:  'round'
      }).addTo(map);
      routeLayers.push(pl);
      seg.coords.forEach(function(c) { routeLatLngs.push(c); });
    });

    /* ── Fit bounds bao gồm route + markers ── */
    var boundsPoints = routeLatLngs.length > 0 ? routeLatLngs : allLatLngs;
    if (boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints).pad(0.15));
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 15);
    }

    /* ── API nhận lệnh từ React Native ── */
    function handleMessage(msg) {
      try {
        var data = JSON.parse(msg);

        /* Cập nhật vị trí driver marker (không reload map) */
        if (data.type === 'UPDATE_DRIVER' && data.lat != null && data.lng != null) {
          var ll = [data.lat, data.lng];
          if (markerMap['driver']) {
            markerMap['driver'].setLatLng(ll);
          } else {
            var icon = makeEmojiIcon('driver', true);
            markerMap['driver'] = L.marker(ll, { icon: icon }).addTo(map).bindPopup('Tài xế 🛵');
          }
          return;
        }

        /* Cập nhật toàn bộ route segments */
        if (data.type === 'UPDATE_ROUTE') {
          routeLayers.forEach(function(l) { map.removeLayer(l); });
          routeLayers  = [];
          routeLatLngs = [];
          (data.segments || []).forEach(function(seg) {
            if (!seg.coords || seg.coords.length < 2) return;
            var pl = L.polyline(seg.coords, {
              color:   seg.color   || '#1565C0',
              weight:  seg.weight  || 5,
              opacity: seg.opacity || 0.85,
              lineJoin: 'round', lineCap: 'round'
            }).addTo(map);
            routeLayers.push(pl);
            seg.coords.forEach(function(c) { routeLatLngs.push(c); });
          });
          /* Fit lại sau khi có route */
          var pts = routeLatLngs.length > 0 ? routeLatLngs : allLatLngs;
          if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.15));
          return;
        }

        /* Fit toàn bộ điểm đang có */
        if (data.type === 'FIT_BOUNDS') {
          var pts = routeLatLngs.length > 0 ? routeLatLngs : allLatLngs;
          if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.15));
          return;
        }

      } catch(e) {}
    }

    /* Lắng nghe message từ RN (Android) */
    document.addEventListener('message', function(e) { handleMessage(e.data); });
    /* iOS */
    window.addEventListener('message', function(e)  { handleMessage(e.data); });

    /* Báo sẵn sàng */
    setTimeout(function() {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
    }, 300);
  </script>
</body>
</html>`;
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function OsmMap({
  region,
  markers = [],
  route = [],
  style,
  onReady,
  webViewRef: externalRef,
}) {
  const internalRef = useRef(null);
  const webRef = externalRef || internalRef;

  // Key để force reload WebView khi cần (VD: driver marker xuất hiện lần đầu)
  const [webViewKey, setWebViewKey] = useState(0);

  // Theo dõi driver marker: khi lần đầu có driver → rebuild HTML với marker đúng
  const hasDriverRef = useRef(false);
  const hasDriver = markers.some((m) => m.id === 'driver');
  if (!hasDriverRef.current && hasDriver) {
    hasDriverRef.current = true;
    // Sẽ trigger reload qua useEffect bên dưới
  }

  // Rebuild HTML với đầy đủ markers + route hiện tại
  const html = buildHtml(region, markers, route);

  // ── Khi route thay đổi sau khi map đã load: inject JS thay vì reload ──
  const prevRouteRef = useRef(null);

  // Force reload WebView khi driver marker xuất hiện lần đầu
  const driverAppearedRef = useRef(false);
  useEffect(() => {
    if (hasDriver && !driverAppearedRef.current) {
      driverAppearedRef.current = true;
      prevRouteRef.current = null; // reset để route được inject lại sau khi WebView reload
      setWebViewKey((k) => k + 1); // reload WebView với HTML mới có driver
    }
  }, [hasDriver]);

  useEffect(() => {
    const routeStr = JSON.stringify(route);
    if (prevRouteRef.current === null) {
      prevRouteRef.current = routeStr;
      return; // Lần đầu đã embed trong HTML
    }
    if (prevRouteRef.current === routeStr) return;
    prevRouteRef.current = routeStr;

    if (!webRef.current || route.length === 0) return;

    const segments = route.map((seg) => ({
      coords: (seg.coords || []).map((c) => [c.latitude, c.longitude]),
      color:   seg.color   ?? '#1565C0',
      weight:  seg.weight  ?? 5,
      opacity: seg.opacity ?? 0.85,
    }));

    const js = `handleMessage(${JSON.stringify(JSON.stringify({ type: 'UPDATE_ROUTE', segments }))});true;`;
    webRef.current.injectJavaScript(js);
  }, [route]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        key={webViewKey}
        ref={webRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://unpkg.com' }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onMessage={(e) => {
          if (e.nativeEvent.data === 'ready' && onReady) onReady();
        }}
        scrollEnabled={false}
        bounces={false}
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  webview:   { flex: 1, backgroundColor: 'transparent' },
});
