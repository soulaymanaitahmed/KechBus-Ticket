import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MapContainer from '../Components/Tracking/MapContainer';
import TrackingBottomSheet from '../Components/Tracking/TrackingBottomSheet';
import NotificationToast from '../Components/Tracking/NotificationToast';
import { useBusTracking } from '../hooks/useBusTracking';
import axios from 'axios';
import './TrackingPage.css';

const TrackingPage = () => {
  const { routeId } = useParams();
  const { busData, notifications, isConnected } = useBusTracking(routeId);
  const [routeInfo, setRouteInfo] = React.useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        // In a real app, we'd have an endpoint like /lignes/:id/path
        // For simulation, we fetch the config from the backend via a mock or a specific endpoint
        // For now, we simulate the route configuration on the frontend as well for mapping
        const res = await axios.get(`http://localhost:8866/lignes`);
        const line = res.data.find(l => l.l_id == routeId || l.l_num == routeId);

        if (line) {
          // Since the backend simulation now uses a hardcoded set of coordinates for "5" and "24",
          // we simulate the path retrieval here. In production, the backend would send the polyline.
          const paths = {
            "5": [
                { lat: 31.6295, lng: -7.9810 }, { lat: 31.6300, lng: -7.9820 }, { lat: 31.6310, lng: -7.9830 },
                { lat: 31.6320, lng: -7.9840 }, { lat: 31.6330, lng: -7.9850 }, { lat: 31.6340, lng: -7.9860 },
                { lat: 31.6350, lng: -7.9870 }, { lat: 31.6360, lng: -7.9880 }, { lat: 31.6370, lng: -7.9890 },
                { lat: 31.6380, lng: -7.9900 }, { lat: 31.6390, lng: -7.9910 }, { lat: 31.6400, lng: -7.9920 },
                { lat: 31.6410, lng: -7.9930 }, { lat: 31.6420, lng: -7.9940 }, { lat: 31.6430, lng: -7.9950 },
                { lat: 31.6440, lng: -7.9960 }, { lat: 31.6450, lng: -7.9970 }, { lat: 31.6460, lng: -7.9980 },
                { lat: 31.6470, lng: -7.9990 }, { lat: 31.6480, lng: -8.0000 },
            ],
            "24": [
                { lat: 31.6200, lng: -8.0100 }, { lat: 31.6210, lng: -8.0110 }, { lat: 31.6220, lng: -8.0120 },
                { lat: 31.6230, lng: -8.0130 }, { lat: 31.6240, lng: -8.0140 }, { lat: 31.6250, lng: -8.0150 },
                { lat: 31.6260, lng: -8.0160 }, { lat: 31.6270, lng: -8.0170 }, { lat: 31.6280, lng: -8.0180 },
                { lat: 31.6290, lng: -8.0190 }, { lat: 31.6300, lng: -8.0200 }, { lat: 31.6310, lng: -8.0210 },
                { lat: 31.6320, lng: -8.0220 }, { lat: 31.6330, lng: -8.0230 }, { lat: 31.6340, lng: -8.0240 },
                { lat: 31.6350, lng: -8.0250 }, { lat: 31.6360, lng: -8.0260 }, { lat: 31.6370, lng: -8.0270 },
                { lat: 31.6380, lng: -8.0280 }, { lat: 31.6390, lng: -8.0290 },
            ]
          };

          const stations = {
            "5": [
                { name: "Gueliz", pathIndex: 4, stopDuration: 5000 },
                { name: "Bab Doukkala", pathIndex: 9, stopDuration: 3000 },
                { name: "Menara", pathIndex: 14, stopDuration: 7000 },
            ],
            "24": [
                { name: "Palmeraie", pathIndex: 4, stopDuration: 5000 },
                { name: "Jamaa El Fna", pathIndex: 9, stopDuration: 4000 },
                { name: "Koutoubia", pathIndex: 14, stopDuration: 6000 },
            ]
          };

          setRouteInfo({
            num: line.l_num || routeId,
            from: line.l_destination1,
            to: line.l_destination2,
            path: paths[routeId] || paths["5"],
            stations: stations[routeId] || stations["5"],
          });
        }
      } catch (err) {
        console.error("Error fetching route info:", err);
      }
    };
    fetchRoute();
  }, [routeId]);

  const dismissNotification = (id) => {
    // Notifications are handled by the hook's internal timeout
  };

  return (
    <div className="tracking-page">
      <MapContainer busData={busData} routeInfo={routeInfo} />

      <TrackingBottomSheet busData={busData} route={routeInfo} />

      <div className="notifications-layer">
        <AnimatePresence>
          {notifications.map((n) => (
            <NotificationToast
              key={n.id}
              notification={n}
              onDismiss={dismissNotification}
            />
          ))}
        </AnimatePresence>
      </div >

      {!isConnected && (
        <div className="connection-banner">
          Connecting to live tracking...
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
