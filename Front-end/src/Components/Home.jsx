import {
  FiTruck,
  FiZap,
  FiShield,
  FiBarChart2,
  FiMapPin,
  FiClock,
  FiArrowRight,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { FaBusAlt } from "react-icons/fa";
import { useState, useEffect } from "react";
import "../Styles/Home.css";
import { Link } from "react-router-dom";

const NAV_LINKS = ["Features", "How It Works", "Lines" , "contact"];

const FEATURES = [
  {
    icon: <FiZap size={24} />,
    title: "Instant e-Ticket",
    desc: "Buy your ticket in under 3 clicks. No queues, no cash — just scan and board.",
  },
  {
    icon: <FiBarChart2 size={24} />,
    title: "Live Crowd Analytics",
    desc: "Real-time peak detection helps operators deploy extra buses before lines saturate.",
  },
  {
    icon: <FiMapPin size={24} />,
    title: "All Marrakech Lines",
    desc: "From Jamaa el-Fna to M'hamid — every route at your fingertips, updated live.",
  },
  {
    icon: <FiClock size={24} />,
    title: "Smart Scheduling",
    desc: "Historical data drives smarter timetables, reducing wait times across the network.",
  },
  {
    icon: <FiShield size={24} />,
    title: "Secure by Design",
    desc: "Every ticket is cryptographically signed. No duplicates. No fraud.",
  },
  {
    icon: <FiTruck size={24} />,
    title: "Admin Dashboard",
    desc: "Full logistics control — manage lines, monitor flows, dispatch additional buses instantly.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your account",
    desc: "Sign up in seconds with your email and get instant access to all lines.",
  },
  {
    num: "02",
    title: "Choose your line",
    desc: "Browse available routes, check occupancy levels, and pick your departure time.",
  },
  {
    num: "03",
    title: "Buy & board",
    desc: "Receive your unique QR ticket, show it on entry, and enjoy a smoother ride.",
  },
];

const LINES = [
  { num: "L1", from: "Jamaa el-Fna", to: "Guéliz", status: "normal" },
  { num: "L8", from: "Bab Doukkala", to: "Massira", status: "busy" },
  { num: "L18", from: "Guéliz", to: "M'hamid", status: "normal" },
  { num: "L26", from: "Menara", to: "Médina", status: "busy" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp-root">
      {/* NAV */}
      <nav className={`lp-nav${scrolled ? " lp-nav--scrolled" : ""}`}>
        <div className="lp-nav__inner">
          <a href="#" className="lp-logo">
            <FaBusAlt className="lp-logo__icon" />
            <span>
              Kech<strong>Bus</strong>
            </span>
          </a>
          <ul className={`lp-nav__links${menuOpen ? " open" : ""}`}>
                {NAV_LINKS.map((l) => (
                  <li key={l}>
                    {l==="contact" ?(
                       <Link to="/contact">{l}</Link>
                    ) : (
                      <a
                        href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {l}
                      </a>

                    )
                    }
                  
                  </li>
                ))}
                <li>

                  <Link to="/signin" className="lp-nav__cta">

                    Get Started
                  </Link>
                </li>
          </ul>
          <button
            className="lp-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero__bg">
          <div className="lp-hero__grid" />
          <div className="lp-hero__glow" />
        </div>
        <div className="lp-hero__content">
          <span className="lp-badge">
            🚌 Initiative Ville Intelligente de Marrakech
          </span>
          <h1 className="lp-hero__title">
            Votre billet de bus,
            <br />
            <em>Réinventé.</em>
          </h1>
          <p className="lp-hero__sub">
            KechBus-Ticket remplace les billets papier par des titres de
            transport numériques instantanés — et fournit aux opérateurs les
            données dont ils ont besoin pour assurer la fluidité du trafic à
            Marrakech.
          </p>
          <div className="lp-hero__actions">
            <Link to="/login" className="lp-btn lp-btn--primary">
              Acheter un billet <FiArrowRight />
            </Link>
            <a href="#features" className="lp-btn lp-btn--ghost">
              Explore Features
            </a>
          </div>
        </div>
        <div className="lp-hero__ticket">
          <div className="lp-ticket">
            <div className="lp-ticket__header">
              <FiTruck size={18} /> KechBus-Ticket
            </div>
            <div className="lp-ticket__line">Ligne 1</div>
            <div className="lp-ticket__route">Jamaa el-Fna → Gueliz</div>
            <div className="lp-ticket__meta">
              <span>
                <FiClock size={12} /> 08:45
              </span>
              <span className="lp-ticket__valid">✓ Validate</span>
            </div>
            <div className="lp-ticket__qr">
              <div className="lp-qr-grid">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div
                    key={i}
                    className={`lp-qr-cell${Math.random() > 0.5 ? " on" : ""}`}
                  />
                ))}
              </div>
            </div>
            <div className="lp-ticket__id">#KB-2026-00847</div>
            <div className="lp-ticket__divider" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <p className="lp-eyebrow">what we offer</p>
          <h2 className="lp-section__title">Pensé pour vous.</h2>
          <div className="lp-features__grid">
            {FEATURES.map((f) => (
              <div className="lp-feature-card" key={f.title}>
                <div className="lp-feature-card__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section lp-section--alt" id="how-it-works">
        <div className="lp-container">
          <p className="lp-eyebrow">simple process</p>
          <h2 className="lp-section__title">
            Trois étapes...
            <br />
            Zéro tracas.
          </h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div className="lp-step" key={s.num}>
                <div className="lp-step__body">
                  <h3>
                    {s.num} - {s.title}
                  </h3>
                  <p>{s.desc}</p>
                  <br />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE LINES */}
      <section className="lp-section" id="lines">
        <div className="lp-container">
          <p className="lp-eyebrow">État du réseau</p>
          <h2 className="lp-section__title">Aperçu des lignes en direct.</h2>
          <div className="lp-lines">
            {LINES.map((l) => (
              <div className="lp-line-card" key={l.num}>
                <div className="lp-line-card__num">{l.num}</div>
                <div className="lp-line-card__route">
                  <span>{l.from}</span>
                  <FiArrowRight size={14} />
                  <span>{l.to}</span>
                </div>
                <div
                  className={`lp-line-card__status lp-line-card__status--${l.status}`}
                >
                  {l.status === "busy" ? "⚠ High demand" : "✓ Normal"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta__glow" />
        <div className="lp-container lp-cta__inner">
          <h2>Prêt à voyager plus intelligemment ?</h2>
          <p>
            Rejoignez les milliers de Marrakchis qui voyagent déjà sans papier.
          </p>
          <Link to="/signup" className="lp-btn lp-btn--primary lp-btn--lg">
            Créer un compte gratuit <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <a href="#" className="lp-logo">
            <FiTruck className="lp-logo__icon" />{" "}
            <span>
              Kech<strong>Bus</strong>
            </span>
          </a>
          <p className="lp-footer__copy">
            © 2026 KechBus-Ticket · UPM — Software Development & IT Security
          </p>
        </div>
      </footer>
    </div>
  );
}
