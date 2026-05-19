import React from 'react';
import { GoogleMap } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '100%' };

const lightTheme = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f4e8' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f0e8d0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8dff0' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const mapOptions = {
  styles: lightTheme,
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  backgroundColor: '#f5f5f0',
  minZoom: 12,
  maxZoom: 19,
  gestureHandling: 'greedy',
  keyboardShortcuts: false,
};

export default function NavigationMap({ onLoad, children, center, mapTypeId = 'roadmap' }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f8f9fb', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          background: '#ffffff', border: '1px solid #e8eaed',
          borderRadius: '16px', padding: '32px 36px', maxWidth: '480px',
          color: '#0f172a', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
            ⚙️ Configuration requise
          </h2>
          <ol style={{ fontSize: '14px', lineHeight: '2', color: '#64748b', paddingLeft: '18px' }}>
            <li>Accédez à <span style={{ color: '#4f46e5' }}>console.cloud.google.com</span></li>
            <li>Activez <strong style={{ color: '#0f172a' }}>Maps JavaScript API</strong></li>
            <li>Créez une clé API</li>
            <li>Ajoutez dans <code style={{ background: '#f8f9fb', padding: '2px 6px', borderRadius: '4px', color: '#4f46e5' }}>.env</code> :<br />
              <code style={{ color: '#4f46e5', fontSize: '12px' }}>VITE_GOOGLE_MAPS_API_KEY=xxx</code>
            </li>
            <li>Redémarrez le serveur de développement</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      options={{ ...mapOptions, mapTypeId }}
      onLoad={onLoad}
    >
      {children}
    </GoogleMap>
  );
}
