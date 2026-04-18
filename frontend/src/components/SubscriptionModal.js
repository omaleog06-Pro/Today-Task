import { useState } from "react";
import { X, Crown, Check } from "lucide-react";
import { useAuth } from "@/App";
import axios from "axios";

export default function SubscriptionModal({ onClose }) {
  const { API, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const { data } = await axios.post(`${API}/subscription/checkout`, { origin_url: origin });
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert("Error al iniciar el pago. Intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="subscription-modal">
      <div className="modal-content modal-enter sub-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} data-testid="close-subscription"><X size={18} /></button>

        <div className="sub-header">
          <Crown size={36} className="sub-crown" />
          <h2 className="modal-title">Today Task Pro</h2>
          <p className="sub-subtitle">Desbloquea todas las funciones</p>
        </div>

        <div className="sub-price">
          <span className="sub-amount">$2.99</span>
          <span className="sub-period">/ mes</span>
        </div>

        <ul className="sub-features">
          <li><Check size={16} /> Sin anuncios</li>
          <li><Check size={16} /> Tipografías personalizables</li>
          <li><Check size={16} /> 4 alarmas exclusivas</li>
          <li><Check size={16} /> Importar audios propios</li>
          <li><Check size={16} /> Soporte prioritario</li>
        </ul>

        <button className="sub-btn" onClick={handleSubscribe} disabled={loading} data-testid="subscribe-btn">
          {loading ? "Procesando..." : "Suscribirme ahora"}
        </button>
        <p className="sub-note">Pago seguro con Stripe. Cancela cuando quieras.</p>
      </div>
    </div>
  );
}
