import { useMemo, useState, lazy, Suspense } from "react";

import "../Styles/Tikets.css";
import "../Styles/LiveBusTracker.css";

const LiveBusTracker = lazy(() => import("./LiveBusTracker"));

import { FaTicketSimple } from "react-icons/fa6";
import { FaBus, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { IoPeople } from "react-icons/io5";
import { BsCalendar3 } from "react-icons/bs";
import { QRCodeSVG } from "qrcode.react";

/** Flat demo fare per passenger, per trip */
const TRIP_PRICE_MAD = 4;

/** Colour palette for line badges — each line gets a distinct hue */
const LINE_COLORS = {
  5: "#2563eb",  // blue
  24: "#d97706",  // amber
  35: "#059669",  // emerald
  45: "#dc2626",  // red
  12: "#7c3aed",  // violet
  9: "#0891b2",  // cyan
  18: "#c026d3",  // fuchsia
};

/** Local lines — stops are neighbourhoods and districts inside Marrakech */
const LINES = [
  {
    id: "l-gueliz-medina",
    line: 5,
    from: "Medina",
    to: "Doha Abwab Marrakech",
    duration: "32 min",
    price: TRIP_PRICE_MAD,
    departures: ["06:30", "08:00", "10:00", "12:30", "15:00", "18:00", "20:00"],
    seatsLeft: 14,
    tag: "Popular",
  },
  {
    id: "l-sidi-tameslouht",
    line: 24,
    from: "Sidi Mimoun",
    to: "Tameslouht",
    duration: "18 min",
    price: TRIP_PRICE_MAD,
    departures: ["07:00", "09:15", "11:30", "14:00", "17:45", "19:30", "21:00"],
    seatsLeft: 22,
    tag: null,
  },
  {
    id: "l-sidi-tahnaout",
    line: 35,
    from: "Sidi Mimoun",
    to: "Tahnaout",
    duration: "35 min",
    price: TRIP_PRICE_MAD,
    departures: ["08:00", "12:00", "16:30"],
    seatsLeft: 6,
    tag: "Few seats",
  },
  {
    id: "l-sidi-amzmiz",
    line: 45,
    from: "Sidi Mimoun",
    to: "Amzmiz",
    duration: "28 min",
    price: TRIP_PRICE_MAD,
    departures: ["06:45", "10:20", "13:00", "18:30"],
    seatsLeft: 31,
    tag: null,
  },
  {
    id: "l-medina-mhamid",
    line: 12,
    from: "Medina",
    to: "M'hamid 9",
    duration: "25 min",
    price: TRIP_PRICE_MAD,
    departures: ["07:30", "11:00", "15:15", "19:00"],
    seatsLeft: 18,
    tag: "Frequent",
  },
  {
    id: "l-sidi-gueliz",
    line: 9,
    from: "Sidi Youssef Ben Ali",
    to: "Guéliz",
    duration: "32 min",
    price: TRIP_PRICE_MAD,
    departures: ["08:15", "12:45", "17:00"],
    seatsLeft: 9,
    tag: null,
  },
  {
    id: "l-targa-massira",
    line: 18,
    from: "Targa",
    to: "Massira",
    duration: "40 min",
    price: TRIP_PRICE_MAD,
    departures: ["06:00", "14:30", "21:00"],
    seatsLeft: 12,
    tag: null,
  },
];

const FROM_OPTIONS = [...new Set(LINES.map((l) => l.from))].sort();
const TO_OPTIONS = [...new Set(LINES.map((l) => l.to))].sort();

function todayISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Tikets() {
  const [fromFilter, setFromFilter] = useState("Guéliz");
  const [toFilter, setToFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [departure, setDeparture] = useState("");
  const [travelDate, setTravelDate] = useState(todayISODate);
  const [passengers, setPassengers] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const [bookingRef, setBookingRef] = useState("");

  const toggleTracking = (lineId) => {
    setTrackingId((prev) => (prev === lineId ? null : lineId));
  };

  const filteredLines = useMemo(() => {
    return LINES.filter((line) => {
      if (line.from !== fromFilter) return false;
      if (toFilter === "all") return true;
      return line.to === toFilter;
    });
  }, [fromFilter, toFilter]);

  const selectedLine = LINES.find((l) => l.id === selectedId) ?? null;

  const totalPrice = selectedLine ? selectedLine.price * passengers : 0;

  const handleSelectLine = (line) => {
    setSelectedId(line.id);
    setDeparture(line.departures[0] ?? "");
    setConfirmed(false);
  };

  const handleConfirm = () => {
    if (!selectedLine || !departure) return;
    const ref = `KB-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookingRef(ref);
    setConfirmed(true);
  };

  const handleNewSearch = () => {
    setConfirmed(false);
    setSelectedId(null);
    setDeparture("");
  };

  return (
    <div className="main-container tikets-page">
      <header className="tikets-header">
        <div>
          <p className="tikets-eyebrow">Marrakech local buses</p>
          <h1 className="tikets-title">Tikets</h1>
          <p className="tikets-sub">
            Local buses inside Marrakech — pick a line between neighbourhoods and book a seat (demo only, no payment).
          </p>
        </div>
        <span className="tikets-badge">Static prototype</span>
      </header>

      <div className="tikets-layout">
        <div className="tikets-main">
          <section className="tikets-filters" aria-label="Filter local lines">
            <div className="tikets-filter">
              <label className="tikets-label" htmlFor="tikets-from">
                <FaMapMarkerAlt aria-hidden /> From
              </label>
              <select
                id="tikets-from"
                className="tikets-select"
                value={fromFilter}
                onChange={(e) => {
                  setFromFilter(e.target.value);
                  setSelectedId(null);
                  setConfirmed(false);
                }}
              >
                {FROM_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="tikets-filter">
              <label className="tikets-label" htmlFor="tikets-to">
                <FaMapMarkerAlt aria-hidden /> To
              </label>
              <select
                id="tikets-to"
                className="tikets-select"
                value={toFilter}
                onChange={(e) => {
                  setToFilter(e.target.value);
                  setSelectedId(null);
                  setConfirmed(false);
                }}
              >
                <option value="all">All stops</option>
                {TO_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <p className="tikets-filter-hint">
              <FaBus aria-hidden /> {filteredLines.length} line{filteredLines.length !== 1 ? "s" : ""} shown
            </p>
          </section>

          <section className="tikets-lines" aria-label="Available bus lines">
            {filteredLines.length === 0 ? (
              <p className="tikets-empty">No lines for this combination. Try another stop pair.</p>
            ) : (
              <ul className="tikets-line-list">
                {filteredLines.map((line) => {
                  const active = selectedId === line.id;
                  return (
                    <li key={line.id}>
                      <div
                        className={`tikets-line-card${active ? " tikets-line-card--active" : ""}`}
                      >
                        <button
                          type="button"
                          className="tikets-line-card__select"
                          onClick={() => handleSelectLine(line)}
                        >
                          <div className="tikets-line-top">
                            <div className="tikets-line-route">
                              <span
                                className="tikets-line-badge"
                                style={{ background: LINE_COLORS[line.line] || "#405d72" }}
                              >
                                Line {line.line}
                              </span>
                              <span className="tikets-line-city">{line.from}</span>
                              <span className="tikets-line-arrow" aria-hidden>
                                →
                              </span>
                              <span className="tikets-line-city">{line.to}</span>
                            </div>
                            {line.tag && <span className="tikets-line-tag">{line.tag}</span>}
                          </div>
                          <div className="tikets-line-meta">
                            <span>
                              <FaClock aria-hidden /> {line.duration}
                            </span>
                            <span>
                              From <strong>{line.price} MAD</strong>
                            </span>
                            <span className="tikets-line-seats">{line.seatsLeft} seats left</span>
                          </div>
                        </button>

                        {/* Track Live toggle */}
                        <button
                          type="button"
                          className={`tikets-track-btn${trackingId === line.id ? " tikets-track-btn--active" : ""
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTracking(line.id);
                          }}
                        >
                          {trackingId === line.id ? "Hide Tracking" : "Track Live 🚍"}
                          <span className="tikets-track-btn__chevron" aria-hidden>▼</span>
                        </button>

                        {/* Collapsible tracker */}
                        <div
                          className={`tikets-tracker-wrapper${trackingId === line.id ? " tikets-tracker-wrapper--open" : ""
                            }`}
                        >
                          <div className="tikets-tracker-inner">
                            {trackingId === line.id && (
                              <Suspense
                                fallback={
                                  <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.85rem", color: "#405d72" }}>
                                    Loading map…
                                  </div>
                                }
                              >
                                <LiveBusTracker
                                  from={line.from}
                                  to={line.to}
                                  duration={line.duration}
                                  lineNumber={line.line}
                                  lineColor={LINE_COLORS[line.line]}
                                />
                              </Suspense>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="tikets-aside" aria-label="Booking summary">
          <div className="tikets-panel">
            <h2 className="tikets-panel-title">
              <FaTicketSimple className="tikets-panel-icon" aria-hidden />
              Your trip
            </h2>

            {confirmed ? (
              <div className="tikets-success">
                <div className="tikets-success-check" aria-hidden>✓</div>
                <p className="tikets-success-title">Booking recorded (demo)</p>
                <p className="tikets-success-ref">{bookingRef}</p>

                <ul className="tikets-success-list">
                  <li>
                    Line {selectedLine.line} · {selectedLine.from} → {selectedLine.to}
                  </li>
                  <li>
                    {travelDate} · {departure}
                  </li>
                  <li>
                    {passengers} passenger{passengers !== 1 ? "s" : ""} · {totalPrice} MAD
                  </li>
                </ul>

                <div className="tikets-qr-wrap">
                  <QRCodeSVG
                    value={JSON.stringify({
                      ref: bookingRef,
                      line: selectedLine.line,
                      route: `${selectedLine.from} → ${selectedLine.to}`,
                      date: travelDate,
                      time: departure,
                      passengers,
                      total: `${totalPrice} MAD`,
                    })}
                    size={140}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#222831"
                    includeMargin={false}
                  />
                  <p className="tikets-qr-label">Scan to verify ticket</p>
                </div>

                <button type="button" className="tikets-btn tikets-btn--ghost" onClick={handleNewSearch}>
                  Book another trip
                </button>
              </div>
            ) : !selectedLine ? (
              <p className="tikets-panel-empty">Select a line on the left to see times and price.</p>
            ) : (
              <>
                <div className="tikets-summary">
                  <p className="tikets-summary-route">
                    <span
                      className="tikets-line-badge tikets-line-badge--sm"
                      style={{ background: LINE_COLORS[selectedLine.line] || "#405d72" }}
                    >
                      Line {selectedLine.line}
                    </span>
                    {selectedLine.from} <span aria-hidden>→</span> {selectedLine.to}
                  </p>
                  <p className="tikets-summary-row">
                    <span>Base fare</span>
                    <span>{selectedLine.price} MAD / pax</span>
                  </p>
                </div>

                <div className="tikets-field">
                  <label className="tikets-label" htmlFor="tikets-date">
                    <BsCalendar3 aria-hidden /> Ride date
                  </label>
                  <input
                    id="tikets-date"
                    type="date"
                    className="tikets-input"
                    value={travelDate}
                    min={todayISODate()}
                    onChange={(e) => setTravelDate(e.target.value)}
                  />
                </div>

                <fieldset className="tikets-fieldset">
                  <legend className="tikets-label">
                    <FaClock aria-hidden /> Departure
                  </legend>
                  <div className="tikets-slots">
                    {selectedLine.departures.map((t) => (
                      <label key={t} className={`tikets-slot${departure === t ? " tikets-slot--on" : ""}`}>
                        <input
                          type="radio"
                          name="dep"
                          value={t}
                          checked={departure === t}
                          onChange={() => setDeparture(t)}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="tikets-field">
                  <label className="tikets-label" htmlFor="tikets-pax">
                    <IoPeople aria-hidden /> Passengers
                  </label>
                  <div className="tikets-stepper">
                    <button
                      type="button"
                      className="tikets-step-btn"
                      aria-label="Decrease passengers"
                      disabled={passengers <= 1}
                      onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                    >
                      −
                    </button>
                    <span className="tikets-step-val" id="tikets-pax">
                      {passengers}
                    </span>
                    <button
                      type="button"
                      className="tikets-step-btn"
                      aria-label="Increase passengers"
                      disabled={passengers >= 6}
                      onClick={() => setPassengers((p) => Math.min(6, p + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="tikets-total">
                  <span>Total (estimate)</span>
                  <strong>{totalPrice} MAD</strong>
                </div>

                <button type="button" className="tikets-btn tikets-btn--primary" onClick={handleConfirm}>
                  Confirm booking (demo)
                </button>
                <p className="tikets-disclaimer">No charge, no SMS — this screen is for layout only.</p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Tikets;
