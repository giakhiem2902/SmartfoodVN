/**
 * OsmMap – bản đồ OSM dùng Leaflet.js bên trong WebView
 * Không cần Google Maps API key, chạy tốt trên mọi Android/iOS.
 *
 * Props:
 *  region      : { latitude, longitude, latitudeDelta, longitudeDelta }
 *  markers     : [{ id, coordinate: { latitude, longitude }, title, color }]
 *  style       : ViewStyle
 *  onReady     : () => void  (gọi khi map load xong)
 */
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const buildHtml = (region, markers = []) => {
  const lat = region?.latitude ?? 10.8231;
  const lng = region?.longitude ?? 106.6297;
  const zoom = region?.latitudeDelta ? Math.round(Math.log2(360 / region.latitudeDelta)) : 13;

  const markersJson = JSON.stringify(
    markers.map((m) => ({
      id: m.id,
      lat: m.coordinate?.latitude,
      lng: m.coordinate?.longitude,
      title: m.title ?? '',
      color: m.color ?? 'red',
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
    html, body, #map { margin:0; padding:0; width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    var markers = ${markersJson};
    markers.forEach(function(m) {
      if (m.lat == null || m.lng == null) return;
      var icon = L.divIcon({
        className: '',
        html: '<div style="background:' + m.color + ';width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.5)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      L.marker([m.lat, m.lng], { icon: icon }).addTo(map).bindPopup(m.title);
    });

    window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
  </script>
</body>
</html>`;
};

export default function OsmMap({ region, markers = [], style, onReady }) {
  const webRef = useRef(null);
  const html = buildHtml(region, markers);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://unpkg.com' }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          if (e.nativeEvent.data === 'ready' && onReady) onReady();
        }}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
