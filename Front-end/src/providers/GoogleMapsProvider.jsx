import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapsContext = createContext(null);

const libraries = ["places"];

export const GoogleMapsProvider = ({ children }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCyL7-Jr6hg6Lugty-YbEoFtf7dAlWPIdQ";

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  if (loadError) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>
        <h2 style={{ color: '#ef4444' }}>Map Load Error</h2>
        <p>Please check your internet connection or API key.</p>
      </div>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {isLoaded ? children : (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f8fafc'
        }}>
          <div className="loading-spinner">Loading Maps...</div>
          <style>{`
            .loading-spinner {
              color: #0f172a;
              font-weight: 600;
              font-family: 'Plus Jakarta Sans', sans-serif;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .loading-spinner::after {
              content: '';
              width: 20px;
              height: 20px;
              border: 3px solid #e2e8f0;
              border-top-color: #3b82f6;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => useContext(GoogleMapsContext);
