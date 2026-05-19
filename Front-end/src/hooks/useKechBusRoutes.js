import { useState, useEffect } from 'react';
import axios from 'axios';

export function useKechBusRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:8866/lignes');
        const mapped = res.data.map(line => ({
          id: line.l_id,
          num: line.l_num || `N${line.l_id}`,
          from: line.l_destination1,
          to: line.l_destination2,
          price: line.l_price,
          busesNbr: line.l_bues_nbr || 0,
          stations: Array.isArray(line.l_stations) ? line.l_stations : [],
          durationFallback: '30 min'
        }));
        setRoutes(mapped);
      } catch (err) {
        console.error("Failed to fetch KechBus routes", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  return { routes, loading, error };
}
