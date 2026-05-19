import { useState, useEffect, useRef } from 'react';

export function useRouteDirections(selectedRoute) {
  const [routePath, setRoutePath] = useState([]);
  const [stations, setStations] = useState([]);
  const [totalDurationSec, setTotalDurationSec] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);

  // Cache results to avoid spamming Google Maps API
  const cache = useRef({});

  useEffect(() => {
    if (!selectedRoute || !window.google || !window.google.maps) return;

    const routeId = selectedRoute.id;
    
    if (cache.current[routeId]) {
      const cached = cache.current[routeId];
      setRoutePath(cached.routePath);
      setStations(cached.stations);
      setTotalDurationSec(cached.totalDurationSec);
      setIsCalculating(false);
      return;
    }

    const calculateRoute = async () => {
      setIsCalculating(true);
      setError(null);

      const directionsService = new window.google.maps.DirectionsService();

      const originStr = `${selectedRoute.from}, Marrakech, Morocco`;
      const destStr = `${selectedRoute.to}, Marrakech, Morocco`;
      
      const waypoints = selectedRoute.stations.map(st => ({
        location: `${st}, Marrakech, Morocco`,
        stopover: true
      }));

      try {
        directionsService.route(
          {
            origin: originStr,
            destination: destStr,
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              const route = result.routes[0];
              
              // 1. Extract polyline
              const path = route.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
              
              // 2. Extract stations (origin + waypoints + destination)
              let generatedStations = [];
              let totalSeconds = 0;

              // Origin
              generatedStations.push({
                name: selectedRoute.from,
                position: { lat: route.legs[0].start_location.lat(), lng: route.legs[0].start_location.lng() },
                type: 'depart',
                index: 0,
                stopDuration: 5000 + Math.floor(Math.random() * 3000)
              });

              // Intermediate stations
              for (let i = 0; i < route.legs.length - 1; i++) {
                const leg = route.legs[i];
                totalSeconds += leg.duration.value;
                generatedStations.push({
                  name: selectedRoute.stations[i] || `Station ${i+1}`,
                  position: { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
                  type: 'station',
                  index: i + 1,
                  stopDuration: 5000 + Math.floor(Math.random() * 3000)
                });
              }

              // Destination
              const lastLeg = route.legs[route.legs.length - 1];
              totalSeconds += lastLeg.duration.value;
              generatedStations.push({
                name: selectedRoute.to,
                position: { lat: lastLeg.end_location.lat(), lng: lastLeg.end_location.lng() },
                type: 'terminus',
                index: generatedStations.length,
                stopDuration: 0
              });

              const resultData = {
                routePath: path,
                stations: generatedStations,
                totalDurationSec: totalSeconds
              };

              cache.current[routeId] = resultData;
              setRoutePath(resultData.routePath);
              setStations(resultData.stations);
              setTotalDurationSec(resultData.totalDurationSec);
            } else {
              console.error("Directions query failed", status);
              setError("Impossible de calculer l'itinéraire via Google Maps.");
              setRoutePath([]);
              setStations([]);
            }
            setIsCalculating(false);
          }
        );
      } catch (err) {
        console.error(err);
        setError("Erreur API Directions.");
        setIsCalculating(false);
      }
    };

    calculateRoute();
  }, [selectedRoute]);

  return { routePath, stations, totalDurationSec, isCalculating, error };
}
