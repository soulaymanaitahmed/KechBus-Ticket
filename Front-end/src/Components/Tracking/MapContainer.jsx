import React, { useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, Polyline, Marker } from '@react-google-maps/api';
import BusMarker from './BusMarker';
import { useMarkerInterpolation } from '../../hooks/useMarkerInterpolation';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};

const darkMobilityStyle = [
  { "C": 100, "elementType": "geometry", "color": "#212121" },
  { "C": 100, "elementType": "labels.text.fill", "color": "#757575" },
  { "C": 100, "elementType": "labels.text.stroke", "color": "#212121" },
  { "C": 100, "featureType": "administrative", "elementType": "geometry", "color": "#30363d" },
  { "C": 100, "featureType": "administrative.province", "elementType": "labels.text.fill", "color": "#8c8c8c" },
  { "C": 100, "featureType": "administrative.province", "elementType": "labels.text.stroke", "color": "#212121" },
  { "C": 100, "featureType": "administrative.locality", "elementType": "labels.text.fill", "color": "#dcdcdc" },
  { "C": 100, "featureType": "administrative.locality", "elementType": "labels.text.stroke", "color": "#212121" },
  { "C": 100, "featureType": "poi", "elementType": "geometry", "color": "#30363d" },
  { "C": 100, "featureType": "poi", "elementType": "labels.text.fill", "color": "#8c8c8c" },
  { "C": 100, "featureType": "poi", "elementType": "labels.text.stroke", "color": "#212121" },
  { "C": 100, "featureType": "road", "elementType": "geometry", "color": "#38414e" },
  { "C": 100, "featureType": "road", "elementType": "geometry.fill", "color": "#2c2f33" },
  { "C": 100, "featureType": "road", "elementType": "labels.text.fill", "color": "#8c8c8c" },
  { "C": 100, "featureType": "road", "elementType": "labels.text.stroke", "color": "#212121" },
  { "C": 100, "featureType": "road.highway", "elementType": "geometry", "color": "#757575" },
  { "C": 100, "featureType": "road.arterial", "elementType": "geometry", "color": "#38414e" },
  { "C": 100, "featureType": "transit", "elementType": "geometry", "color": "#2f3940" },
  { "C": 100, "featureType": "transit.station", "elementType": "labels.text.fill", "color": "#8f8f8f" },
  { "C": 100, "featureType": "water", "elementType": "geometry", "color": "#17263c" },
  { "C": 100, "featureType": "water", "elementType": "labels.text.fill", "color": "#515c6d" },
  { "C": 100, "featureType": "water", "elementType": "labels.text.stroke", "color": "#17263c" },
];

const MapContainer = ({ busData, routeInfo }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  });

  const mapRef = useRef(null);
  const interpolatedPos = useMarkerInterpolation(busData?.lat && busData?.lng ? { lat: busData.lat, lng: busData.lng } : null);

  useEffect(() => {
    if (mapRef.current && interpolatedPos) {
      mapRef.current.panTo(interpolatedPos);
      mapRef.current.setZoom(15);
    }
  }, [interpolatedPos]);

  if (!isLoaded) return <div className="map-loader">Loading Map...</div>;

  const fullPath = routeInfo?.path || [];
  const progress = busData?.progress || 0;
  const splitIndex = Math.floor(fullPath.length * progress);

  const completedPath = fullPath.slice(0, splitIndex + 1);
  const remainingPath = fullPath.slice(splitIndex);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={interpolatedPos || { lat: 31.6295, lng: -7.9810 }}
      zoom={15}
      options={{
        styles: darkMobilityStyle,
        disableDefaultUI: true,
        zoomControl: false,
      }}
      onLoad={(map) => (mapRef.current = map)}
    >
      {/* Completed Route - Glowing Blue */}
      {completedPath.length > 1 && (
        <Polyline
          path={completedPath}
          options={{
            strokeColor: '#3b82f6',
            strokeOpacity: 0.9,
            strokeWeight: 6,
            geodesic: true,
          }}
        />
      )}

      {/* Remaining Route - Subtle Grey */}
      {remainingPath.length > 1 && (
        <Polyline
          path={remainingPath}
          options={{
            strokeColor: '#4b5563',
            strokeOpacity: 0.6,
            strokeWeight: 4,
            geodesic: true,
          }}
        />
      )}

      {/* Station Markers */}
      {routeInfo?.stations?.map((station, idx) => (
        <Marker
          key={`station-${idx}`}
          position={routeInfo.path[station.pathIndex]}
          label={{
            text: station.name,
            className: 'station-label',
            color: 'white'
          }}
          options={{
            icon: {
              path: 'M12 2C8.243 2 5 5.243 5 9C5 13.314 8.243 17 12 17C15.757 17 19 13.314 19 9C19 5.243 15.757 2 12 2Z',
              fillColor: progress >= (station.pathIndex / fullPath.length) ? '#10b981' : '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 0.5,
            }
          }}
        />
      ))}

      {interpolatedPos && (
        <OverlayView
          mapPaneOptions={{ pointerEvents: 'auto' }}
          position={interpolatedPos}
        >
          <BusMarker position={interpolatedPos} heading={busData?.heading || 0} />
        </OverlayView>
      )}
    </GoogleMap>
  );
};

export default MapContainer;
