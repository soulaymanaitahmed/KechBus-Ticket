import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaQrcode, FaCheckCircle, FaTimesCircle, FaBus, FaCamera, FaTimes, FaList, FaPrint, FaArrowRight, FaSyncAlt } from "react-icons/fa";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import "../Styles/BusScanner.css";

export default function BusScanner() {
  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [scannedCode, setScannedCode] = useState("");
  
  // Camera scanning states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const html5QrCodeRef = useRef(null);

  // Live Console Log Stream History
  const [history, setHistory] = useState([
    { id: 1, time: "02:45:10", label: "Abonnement #000007", status: "VALIDÉ", valid: true },
    { id: 2, time: "02:42:04", label: "Ticket #000184", status: "UTILISÉ", valid: false },
    { id: 3, time: "02:30:15", label: "Ticket #000102", status: "VALIDÉ", valid: true }
  ]);

  // Stop camera scanning
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error("Erreur lors de l'arrêt de la caméra:", err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
    setCameraActive(false);
  };

  // Start camera scanning
  const startCamera = async () => {
    setResult(null);
    setCameraError("");
    setCameraActive(true);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("camera-scanner-view");
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            setQrData(decodedText);
            handleScanText(decodedText);
            stopCamera();
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera startup error:", err);
        setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        setCameraActive(false);
      }
    }, 150);
  };

  useEffect(() => {
    document.body.classList.add("bus-body-lock");
    return () => {
      document.body.classList.remove("bus-body-lock");
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(err => console.error("Scanner cleanup error:", err));
      }
    };
  }, []);

  const handleScan = () => {
    handleScanText(qrData);
  };

  const handleScanText = async (valueToScan) => {
    const trimmed = String(valueToScan || "").trim();
    if (!trimmed) {
      setResult({ valid: false, message: "Veuillez entrer une valeur QR." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const host = window.location.hostname || "localhost";
      const res = await axios.post(`http://${host}:8866/bus/scan`, { qrData: trimmed });
      setResult(res.data || { valid: false, message: "Aucune donnée reçue." });
      setScannedCode(trimmed);

      // Prepend to live validation console stream safely
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString("fr-FR", { hour12: false }),
        label: res.data?.ticket 
          ? `Ticket #${String(res.data.ticket.t_id || "").padStart(6, "0")}`
          : `Carte #${String(res.data?.clientId || "").padStart(6, "0")}`,
        status: res.data?.valid ? "VALIDÉ" : "REFUSÉ",
        valid: !!res.data?.valid
      };
      setHistory(prev => [newLog, ...prev]);

    } catch (err) {
      const payload = err.response?.data || {};
      const errorMsg = payload.message || payload.error || "Échec de vérification du QR.";
      
      setResult({
        valid: false,
        message: errorMsg,
        ...payload,
      });

      // Prepend error to live console stream safely
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString("fr-FR", { hour12: false }),
        label: trimmed.match(/^CLIENT-(\d+)$/i) ? `Carte Client` : `Ticket QR`,
        status: "REFUSÉ",
        valid: false
      };
      setHistory(prev => [newLog, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bus-page">
      <div className="bus-dashboard-layout">
        
        {/* ==========================================
           COLUMN 1: Driver Console Terminal & Live Logs
           ========================================== */}
        <aside className="bus-aside-panel">
          <div className="aside-header">
            <FaBus className="aside-logo" />
            <div className="aside-title-block">
              <h2>KECHBUS</h2>
              <span>CONSOLE CONDUCTEUR</span>
            </div>
          </div>

          <div className="console-status-box">
            <span className="status-dot pulsing"></span>
            <div className="status-texts">
              <span className="status-label">VALIDEUR ACTIF</span>
              <span className="status-desc">En attente de scan...</span>
            </div>
          </div>

          <div className="aside-log-header">
            <FaList />
            <span>FLUX DES VALIDATIONS</span>
          </div>

          <div className="live-logs-stream">
            {history.map((log) => (
              <div key={log.id} className={`log-row ${log.valid ? "log-ok" : "log-ko"}`}>
                <span className="log-time">{log.time}</span>
                <span className="log-label">{log.label}</span>
                <span className="log-badge">{log.status}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ==========================================
           COLUMN 2: High-Tech Thermal Printer Station (Center)
           ========================================== */}
        <section className="bus-printer-panel">
          <div className="printer-header">
            <FaPrint />
            <span>IMPRIMANTE DE TICKETS</span>
          </div>

          <div className="printer-feed-area">
            {/* The physical printer slot decoration */}
            <div className="printer-dispenser-slot">
              <div className="printer-led-light"></div>
            </div>

            {/* Ticket Spit Output */}
            {result && result.valid && (result.ticket || result.subscription) ? (
              <div className="printer-spit-container">
                <div className="bus-ticket-receipt-wrap animate-print-slide">
                  <div className="bus-ticket-receipt">
                    <div className="receipt-dash-edge"></div>
                    
                    <div className="receipt-content">
                      <div className="receipt-header">
                        <div className="receipt-icon-bg">
                          <FaBus className="receipt-logo" />
                        </div>
                        <h2 className="receipt-company">KECHBUS TRANSPORT</h2>
                        <p className="receipt-tagline">VOTRE COMPAGNON DE ROUTE</p>
                        <div className="receipt-badge">
                          {result.ticket ? "TICKET UNIQUE DE VOYAGE" : "PASS D'ABONNEMENT MENSUEL"}
                        </div>
                      </div>

                      <div className="receipt-dotted-divider"></div>

                      <div className="receipt-meta-grid">
                        {result.ticket ? (
                          <>
                            <div className="receipt-row">
                              <span className="receipt-label">TICKET ID</span>
                              <span className="receipt-val">#{String(result.ticket.t_id || "").padStart(6, "0")}</span>
                            </div>
                            <div className="receipt-row">
                              <span className="receipt-label">LIGNE NO</span>
                              <span className="receipt-val">LIGNE {result.ticket.l_id}</span>
                            </div>
                            <div className="receipt-row">
                              <span className="receipt-label">TRAJET</span>
                              <span className="receipt-val receipt-route">{result.ticket.route}</span>
                            </div>
                            <div className="receipt-row">
                              <span className="receipt-label">PASSAGER</span>
                              <span className="receipt-val">{result.ticket.c_username}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="receipt-row">
                              <span className="receipt-label">CARTE CLIENT NO</span>
                              <span className="receipt-val">#{String(result.clientId || "").padStart(6, "0")}</span>
                            </div>
                            <div className="receipt-row">
                              <span className="receipt-label">FORMULE</span>
                              <span className="receipt-val">
                                {result.subscription?.s_plan 
                                  ? String(result.subscription.s_plan).replace(/_/g, " ").toUpperCase() 
                                  : "STANDARD"}
                              </span>
                            </div>
                            <div className="receipt-row">
                              <span className="receipt-label">VOYAGES JOUR</span>
                              <span className="receipt-val">
                                {result.usage?.ridesUsed} / {result.usage?.dailyLimit}
                              </span>
                            </div>
                            
                            {/* Giant pass stamp representation */}
                            <div className="receipt-row receipt-highlight font-large">
                              <span className="receipt-label">RESTANTS JOUR</span>
                              <span className="receipt-val count-badge">X{result.usage?.remaining}</span>
                            </div>
                          </>
                        )}

                        <div className="receipt-row">
                          <span className="receipt-label">VALIDÉ LE</span>
                          <span className="receipt-val">
                            {new Date().toLocaleString("fr-FR", { hour12: false })}
                          </span>
                        </div>
                      </div>

                      <div className="receipt-dotted-divider"></div>

                      <div className="receipt-qrcode-wrap">
                        <QRCodeSVG
                          value={scannedCode || "KECHBUS"}
                          size={110}
                          level="M"
                          bgColor="transparent"
                          fgColor="#000000"
                          className="receipt-svg-qrcode"
                        />
                        <span className="barcode-serial">
                          {scannedCode || "KECHBUS"}
                        </span>
                      </div>

                      <div className="receipt-dotted-divider"></div>

                      <div className="receipt-footer">
                        <p className="thank-you">BON VOYAGE !</p>
                        <p className="sub-thank-you">Merci d'avoir choisi KechBus</p>
                      </div>
                    </div>

                    <div className="receipt-dash-edge bottom"></div>
                  </div>
                </div>

                {/* Floating dynamic high-tech quantity indicator beside the ticket receipt */}
                {result.ticket && result.ticket.t_nbr > 1 && (
                  <div className="printer-multi-ticket-indicator">
                    <span className="multi-label">LIVRAISON</span>
                    <span className="multi-value">X{result.ticket.t_nbr}</span>
                    <span className="multi-sub">BILLETS</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="printer-blueprint-placeholder">
                <div className="blueprint-ticket-outline">
                  <FaPrint className="blueprint-icon" />
                  <p>En attente d'impression...</p>
                  <span>Scannez un ticket valide pour lancer l'impression automatique du reçu conducteur.</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==========================================
           COLUMN 3: Main Camera Previewer & Validator Panel (Right)
           ========================================== */}
        <main className="bus-main-viewport">
          <div className="viewport-header">
            <h1>Zone de Contrôle</h1>
            <p>Présentez le code QR devant la caméra ou saisissez-le manuellement ci-dessous.</p>
          </div>

          {/* Glowing Camera Scanning Viewport Frame */}
          <div className="camera-frame-outer">
            {cameraActive ? (
              <div className="camera-preview-container">
                <div id="camera-scanner-view" className="camera-viewfinder"></div>
                <div className="camera-laser-line"></div>
                <button className="bus-btn btn-stop-camera" onClick={stopCamera}>
                  <FaTimes /> Arrêter la Caméra
                </button>
              </div>
            ) : (
              <div className="camera-fallback-screen">
                <div className="camera-fallback-ring">
                  <FaCamera className="fallback-camera-icon" />
                </div>
                <p>Scanner inactif</p>
                <button className="bus-btn btn-camera-trigger" onClick={startCamera}>
                  Déclencher le Scanner
                </button>
              </div>
            )}
          </div>

          {cameraError && <p className="camera-err-msg">{cameraError}</p>}

          {/* Manual Input form */}
          <div className="manual-control-card">
            <span className="card-mini-title">Saisie Manuelle de Secours</span>
            <div className="bus-input-row">
              <div className="bus-input-wrap">
                <FaQrcode className="bus-input-icon" />
                <input
                  type="text"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="Code QR du ticket..."
                  className="bus-input"
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                />
              </div>
              <button className="bus-btn btn-manual-submit" onClick={handleScan} disabled={loading || cameraActive}>
                {loading ? <FaSyncAlt className="spinning" /> : <FaArrowRight />}
              </button>
            </div>
          </div>

          {/* Simple validation feedback alert (fails/success) */}
          {result && (
            <div className={`bus-result-alert ${result.valid ? "alert-success" : "alert-error"}`}>
              {result.valid ? <FaCheckCircle /> : <FaTimesCircle />}
              <div className="alert-body">
                <span className="alert-title">{result.valid ? "VALIDATION CONFIRMÉE" : "VALIDATION ÉCHOUÉE"}</span>
                <p className="alert-message">{result.message || "Code traité avec succès."}</p>
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
