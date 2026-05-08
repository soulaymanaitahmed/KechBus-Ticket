import { useState } from "react";
import axios from "axios";
import { FaQrcode, FaCheckCircle, FaTimesCircle, FaBus } from "react-icons/fa";
import "../Styles/BusScanner.css";

export default function BusScanner() {
  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    const trimmed = qrData.trim();
    if (!trimmed) {
      setResult({ valid: false, message: "Veuillez entrer une valeur QR." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:8866/bus/scan", { qrData: trimmed });
      setResult(res.data);
    } catch (err) {
      const payload = err.response?.data || {};
      setResult({
        valid: false,
        message: payload.message || payload.error || "Echec de verification du QR.",
        ...payload,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bus-page">
      <div className="bus-card">
        <h1 className="bus-title">
          <FaBus /> Scanner Bus
        </h1>
        <p className="bus-subtitle">
          Scannez un QR de ticket (ex: <code>123</code>) ou de client (ex: <code>CLIENT-7</code>).
        </p>

        <div className="bus-input-wrap">
          <FaQrcode className="bus-input-icon" />
          <input
            type="text"
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            placeholder="Entrez/collez la valeur QR..."
            className="bus-input"
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
        </div>

        <button className="bus-btn" onClick={handleScan} disabled={loading}>
          {loading ? "Verification..." : "Verifier QR"}
        </button>

        {result && (
          <div className={`bus-result ${result.valid ? "ok" : "ko"}`}>
            <div className="bus-result-head">
              {result.valid ? <FaCheckCircle /> : <FaTimesCircle />}
              <span>{result.valid ? "Valide" : "Refuse"}</span>
            </div>
            <p className="bus-result-msg">{result.message || "Resultat recu."}</p>

            {result.qrType && <p><strong>Type:</strong> {result.qrType}</p>}
            {result.ticket?.t_id && (
              <>
                <p><strong>Ticket ID:</strong> #{result.ticket.t_id}</p>
                <p><strong>Client:</strong> {result.ticket.c_username} (#{result.ticket.c_id})</p>
                <p><strong>Ligne:</strong> {result.ticket.route}</p>
              </>
            )}
            {result.clientId && <p><strong>Client ID:</strong> #{result.clientId}</p>}
            {result.subscription?.s_plan && (
              <p><strong>Plan:</strong> {String(result.subscription.s_plan).replaceAll("_", " ")}</p>
            )}
            {result.usage && (
              <p>
                <strong>Usage aujourd'hui:</strong> {result.usage.ridesUsed}/{result.usage.dailyLimit}
                {" "}({result.usage.remaining} restant)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
