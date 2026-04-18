import { useState, useEffect, useRef } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";

const formatDateTime = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function DateTimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d.toISOString().split('T')[0]);
      setSelectedTime(d.toTimeString().slice(0, 5));
    } else {
      setSelectedDate(""); setSelectedTime("");
    }
  }, [value]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const setDate = (d) => { setSelectedDate(d); if (d && selectedTime) onChange(`${d}T${selectedTime}`); };
  const setTime = (t) => { setSelectedTime(t); if (selectedDate && t) onChange(`${selectedDate}T${t}`); };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();

  return (
    <div className="datetime-picker" ref={ref}>
      <button type="button" className={`datetime-trigger ${value ? "has-value" : ""}`} onClick={() => setIsOpen(!isOpen)} data-testid="datetime-trigger">
        <Clock size={16} />
        <span>{value ? formatDateTime(value) : "Añadir fecha"}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && (
        <div className="datetime-dropdown" data-testid="datetime-dropdown">
          <div className="datetime-section">
            <span className="datetime-section-label">Fecha rápida</span>
            <div className="quick-options">
              <button type="button" className={`quick-option ${selectedDate === today ? "active" : ""}`} onClick={() => setDate(today)} data-testid="quick-date-hoy">Hoy</button>
              <button type="button" className={`quick-option ${selectedDate === tomorrow ? "active" : ""}`} onClick={() => setDate(tomorrow)} data-testid="quick-date-mañana">Mañana</button>
            </div>
          </div>
          <div className="datetime-section">
            <span className="datetime-section-label">O elige fecha</span>
            <input type="date" className="date-input" value={selectedDate} onChange={e => setDate(e.target.value)} data-testid="date-input" />
          </div>
          <div className="datetime-section">
            <span className="datetime-section-label">Hora</span>
            <input type="time" className="time-input" value={selectedTime} onChange={e => setTime(e.target.value)} data-testid="time-input" />
          </div>
          <div className="datetime-actions">
            <button type="button" className="datetime-clear" onClick={() => { setSelectedDate(""); setSelectedTime(""); onChange(""); setIsOpen(false); }} data-testid="clear-datetime">Limpiar</button>
            <button type="button" className="datetime-confirm" onClick={() => setIsOpen(false)} data-testid="confirm-datetime">Listo</button>
          </div>
        </div>
      )}
    </div>
  );
}
