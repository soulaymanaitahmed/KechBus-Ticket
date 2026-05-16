import React, { useState, useEffect } from "react";
import { GoogleMap, DirectionsRenderer } from "@react-google-maps/api";
import { FiX, FiClock, FiMapPin, FiNavigation } from "react-icons/fi";
import "../Styles/RouteMapModal.css";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 31.6295,
  lng: -7.9811, // Marrakech center
};

export default function RouteMapModal({ isOpen, onClose, route }) {
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && route) {
      calculateRoute();
    }
    // Cleanup if closed
    if (!isOpen) {
      setDirectionsResponse(null);
      setDistance("");
      setDuration("");
      setError(null);
    }
  }, [isOpen, route]);

  async function calculateRoute() {
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();

    try {
      const results = await directionsService.route({
        origin: `${route.from}, Marrakech, Morocco`,
        destination: `${route.to}, Marrakech, Morocco`,
        // eslint-disable-next-line no-undef
        travelMode: google.maps.TravelMode.DRIVING,
      });

      setDirectionsResponse(results);
      setDistance(results.routes[0].legs[0].distance.text);
      setDuration(results.routes[0].legs[0].duration.text);
      setError(null);
    } catch (err) {
      console.error("Error fetching directions", err);
      setError("Could not load route directions.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="rmm-overlay" onClick={onClose}>
      <div className="rmm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rmm-close-btn" onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className="rmm-content">
          {/* Header */}
          <div className="rmm-header">
            <div className="rmm-badge">{route?.num}</div>
            <h2>
              {route?.from} → {route?.to}
            </h2>
          </div>

          {/* Map Section */}
          <div className="rmm-map-container">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={13}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                }}
              >
                {directionsResponse && (
                  <DirectionsRenderer
                    directions={directionsResponse}
                    options={{
                      polylineOptions: {
                        strokeColor: "#4f46e5", // Indigo-600
                        strokeWeight: 5,
                      },
                    }}
                  />
                )}
              </GoogleMap>
            {error && <div className="rmm-error">{error}</div>}
          </div>

          {/* Details Section */}
          <div className="rmm-details">
            <div className="rmm-detail-card">
              <FiMapPin className="rmm-icon" />
              <div>
                <p>Distance</p>
                <strong>{distance || "--"}</strong>
              </div>
            </div>
            <div className="rmm-detail-card">
              <FiClock className="rmm-icon" />
              <div>
                <p>Est. Duration</p>
                <strong>{duration || "--"}</strong>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rmm-actions">
            <button 
              className="rmm-btn rmm-btn-primary"
              onClick={() => {
                window.open(`https://www.google.com/maps/dir/?api=1&origin=${route.from}, Marrakech&destination=${route.to}, Marrakech`, "_blank");
              }}
            >
              <FiNavigation /> Start Navigation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
