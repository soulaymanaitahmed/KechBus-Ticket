import "../Styles/Dashboard.css";

import { FaTicketSimple } from "react-icons/fa6";
import { FaBus, FaRoute } from "react-icons/fa";
import { IoTrendingUp } from "react-icons/io5";
import { BsClock, BsShieldCheck } from "react-icons/bs";

const STATS = [
  {
    label: "Tickets today",
    value: "142",
    hint: "+12% vs yesterday",
    icon: FaTicketSimple,
    accent: "stat-accent--teal",
  },
  {
    label: "Est. revenue (MAD)",
    value: "24,500",
    hint: "Cash + card",
    icon: IoTrendingUp,
    accent: "stat-accent--green",
  },
  {
    label: "Departures on time",
    value: "94%",
    hint: "Last 7 days",
    icon: BsShieldCheck,
    accent: "stat-accent--blue",
  },
  {
    label: "Active lines",
    value: "7",
    hint: "Local Marrakech",
    icon: FaRoute,
    accent: "stat-accent--slate",
  },
];

const DEPARTURES = [
  { time: "06:30", route: "Guéliz → Medina", gate: "G2", seats: "38/45", status: "Boarding" },
  { time: "07:15", route: "Hay Hassani → Guéliz", gate: "H1", seats: "41/45", status: "On time" },
  { time: "08:00", route: "Medina → Palmeraie", gate: "M4", seats: "45/45", status: "Full" },
  { time: "09:20", route: "Menara → Medina", gate: "N3", seats: "22/40", status: "On time" },
  { time: "10:45", route: "Targa → Massira", gate: "T2", seats: "31/45", status: "Delayed" },
];

const RIDERSHIP = [
  { day: "Mon", pct: 62 },
  { day: "Tue", pct: 71 },
  { day: "Wed", pct: 58 },
  { day: "Thu", pct: 80 },
  { day: "Fri", pct: 92 },
  { day: "Sat", pct: 88 },
  { day: "Sun", pct: 76 },
];

function Dashboard() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="main-container dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Operations overview</p>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-sub">{today}</p>
        </div>
        <span className="dashboard-badge">Static prototype</span>
      </header>

      <section className="dashboard-stats" aria-label="Key metrics">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <article key={s.label} className={`dashboard-stat ${s.accent}`}>
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-label">{s.label}</span>
                <span className="dashboard-stat-icon" aria-hidden>
                  <Icon />
                </span>
              </div>
              <p className="dashboard-stat-value">{s.value}</p>
              <p className="dashboard-stat-hint">{s.hint}</p>
            </article>
          );
        })}
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-panel" aria-labelledby="dep-heading">
          <div className="dashboard-panel-head">
            <h2 id="dep-heading" className="dashboard-panel-title">
              <FaBus className="dashboard-panel-title-icon" aria-hidden />
              Upcoming departures
            </h2>
            <span className="dashboard-panel-meta">
              <BsClock aria-hidden /> Local network
            </span>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Route</th>
                  <th>Stand</th>
                  <th>Seats</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTURES.map((row) => (
                  <tr key={`${row.time}-${row.route}`}>
                    <td className="dashboard-td-time">{row.time}</td>
                    <td>{row.route}</td>
                    <td>{row.gate}</td>
                    <td>{row.seats}</td>
                    <td>
                      <span className={`dash-tag dash-tag--${row.status.replace(/\s+/g, "-").toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel" aria-labelledby="chart-heading">
          <div className="dashboard-panel-head">
            <h2 id="chart-heading" className="dashboard-panel-title">
              Weekly ridership
            </h2>
            <span className="dashboard-panel-meta">Index (demo)</span>
          </div>
          <div className="dashboard-bars" role="img" aria-label="Bar chart of weekly ridership index">
            {RIDERSHIP.map((d) => (
              <div key={d.day} className="dashboard-bar-col">
                <div className="dashboard-bar-track">
                  <div className="dashboard-bar-fill" style={{ height: `${d.pct}%` }} title={`${d.day}: ${d.pct}%`} />
                </div>
                <span className="dashboard-bar-label">{d.day}</span>
              </div>
            ))}
          </div>
          <ul className="dashboard-quick">
            <li>
              <strong>Open counter</strong>
              <span>Guéliz — 2 agents</span>
            </li>
            <li>
              <strong>Peak window</strong>
              <span>Fri 17:00–20:00</span>
            </li>
            <li>
              <strong>Notes</strong>
              <span>No backend; data is placeholder</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
