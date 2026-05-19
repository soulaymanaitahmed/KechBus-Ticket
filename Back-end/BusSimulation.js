const ROUTES_DATA = require('./routesConfig');

class BusSimulation {
  constructor(routeId, driverName) {
    this.routeId = routeId;
    this.driverName = driverName;
    this.config = ROUTES_DATA[routeId] || ROUTES_DATA["5"];
    this.currentPathIndex = 0;
    this.state = 'MOVING'; // MOVING, SLOWING, STOPPED, WAITING, ACCELERATING
    this.waitTimer = 0;
    this.speedFactor = 1.0;

    // Coordinates
    this.pos = this.config.path[0];
    this.prevPos = this.pos;
  }

  clamp(lat, lng) {
    return {
      lat: Math.max(30, Math.min(32, lat)),
      lng: Math.max(-9, Math.min(-7, lng))
    };
  }

  calculateHeading(p1, p2) {
    const dy = p2.lat - p1.lat;
    const dx = p2.lng - p1.lng;
    return Math.atan2(dx, dy) * (180 / Math.PI);
  }

  tick() {
    const path = this.config.path;
    const stations = this.config.stations;

    this.prevPos = { ...this.pos };

    switch (this.state) {
      case 'MOVING':
        this.currentPathIndex++;
        if (this.currentPathIndex >= path.length) {
          this.currentPathIndex = 0; // Loop back to start
        }
        this.pos = path[this.currentPathIndex];

        // Check if approaching a station
        const nextStation = stations.find(s => s.pathIndex === this.currentPathIndex + 1);
        if (nextStation) {
          this.state = 'SLOWING';
        }
        break;

      case 'SLOWING':
        this.currentPathIndex++;
        if (this.currentPathIndex >= path.length) this.currentPathIndex = 0;
        this.pos = path[this.currentPathIndex];

        const currentStation = stations.find(s => s.pathIndex === this.currentPathIndex);
        if (currentStation) {
          this.state = 'STOPPED';
          this.waitTimer = currentStation.stopDuration;
        } else {
          this.state = 'MOVING';
        }
        break;

      case 'STOPPED':
        this.state = 'WAITING';
        break;

      case 'WAITING':
        this.waitTimer -= 3000; // Assuming tick is every 3s
        if (this.waitTimer <= 0) {
          this.state = 'ACCELERATING';
        }
        break;

      case 'ACCELERATING':
        this.state = 'MOVING';
        this.currentPathIndex++;
        if (this.currentPathIndex >= path.length) this.currentPathIndex = 0;
        this.pos = path[this.currentPathIndex];
        break;
    }

    this.pos = this.clamp(this.pos.lat, this.pos.lng);

    const statusText = this.getStatusText();
    const progress = this.currentPathIndex / (path.length - 1);

    return {
      lat: this.pos.lat,
      lng: this.pos.lng,
      prevLat: this.prevPos.lat,
      prevLng: this.prevPos.lng,
      heading: this.calculateHeading(this.prevPos, this.pos),
      status: statusText,
      progress: progress,
      currentStation: this.getCurrentStationName(),
    };
  }

  getStatusText() {
    switch (this.state) {
      case 'MOVING': return 'Moving';
      case 'SLOWING': return 'Arriving at station';
      case 'STOPPED': return 'At station';
      case 'WAITING': return 'Waiting at station';
      case 'ACCELERATING': return 'Departing';
      default: return 'Moving';
    }
  }

  getCurrentStationName() {
    const station = this.config.stations.find(s => s.pathIndex === this.currentPathIndex);
    return station ? station.name : null;
  }
}

module.exports = BusSimulation;
