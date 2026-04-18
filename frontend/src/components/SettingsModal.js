import { X, Volume2, VolumeX, Crown, Lock, Upload } from "lucide-react";
import { useRef } from "react";

const THEMES = [
  { id: "light", name: "Claro", emoji: "☀️" },
  { id: "dark", name: "Oscuro", emoji: "🌙" },
  { id: "corporate_blue", name: "Azul", emoji: "💎" },
  { id: "nature_green", name: "Verde", emoji: "🌿" },
];

const FONTS = [
  { id: "classic", name: "Clásica", preview: "Elegante", family: "'Work Sans', sans-serif" },
  { id: "burbuja", name: "Burbuja", preview: "Divertida", family: "'Fredoka', sans-serif" },
  { id: "dibujo", name: "Dibujo", preview: "Manuscrita", family: "'Caveat', cursive" },
];

const ALARM_SOUNDS = [
  { id: "gentle-wake", name: "Despertar Suave" },
  { id: "morning-dew", name: "Rocío Matinal" },
  { id: "soft-chime", name: "Campana Suave" },
  { id: "calm-bell", name: "Campana Calma" },
];

export default function SettingsModal({ onClose, theme, setTheme, font, setFont, soundEnabled, setSoundEnabled, alarmSound, setAlarmSound, isPremium, onUpgrade }) {
  const fileRef = useRef(null);

  const playPreview = (soundId) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const configs = {
        "gentle-wake": { freq: [440, 523, 659], dur: 0.3 },
        "morning-dew": { freq: [523, 659, 784], dur: 0.25 },
        "soft-chime": { freq: [659, 784, 880], dur: 0.2 },
        "calm-bell": { freq: [392, 494, 587], dur: 0.35 },
      };
      const c = configs[soundId] || configs["gentle-wake"];
      c.freq.forEach((f, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.setValueAtTime(f, ctx.currentTime + i * c.dur);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * c.dur);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i + 1) * c.dur);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * c.dur); osc.stop(ctx.currentTime + (i + 1) * c.dur);
      });
    } catch (e) { /* silent */ }
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="settings-modal">
      <div className="modal-content modal-enter settings-modal-scroll" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} data-testid="close-settings-btn"><X size={18} /></button>
        <h2 className="modal-title">Configuración</h2>

        {/* Theme */}
        <div className="settings-section">
          <span className="settings-label">Tema</span>
          <div className="theme-grid">
            {THEMES.map(t => (
              <button key={t.id} className={`theme-button ${theme === t.id ? "active" : ""}`} onClick={() => setTheme(t.id)} data-testid={`theme-${t.id}`}>
                {t.emoji} {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Font - locked for free */}
        <div className="settings-section">
          <span className="settings-label">Tipografía {!isPremium && <Lock size={12} style={{display:'inline',verticalAlign:'middle',marginLeft:4}} />}</span>
          {isPremium ? (
            <div className="font-grid">
              {FONTS.map(f => (
                <button key={f.id} className={`font-button ${font === f.id ? "active" : ""}`} onClick={() => setFont(f.id)} style={{ fontFamily: f.family }} data-testid={`font-${f.id}`}>
                  <span>{f.name}</span><span className="font-preview">{f.preview}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="locked-feature" data-testid="locked-fonts">
              <Crown size={20} />
              <span>Desbloquea tipografías con Premium</span>
              <button className="unlock-btn" onClick={onUpgrade} data-testid="unlock-fonts-btn">Desbloquear</button>
            </div>
          )}
        </div>

        {/* Sound */}
        <div className="settings-section">
          <span className="settings-label">Sonido</span>
          <button className={`sound-toggle ${soundEnabled ? "active" : ""}`} onClick={() => { setSoundEnabled(!soundEnabled); }} data-testid="sound-toggle">
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{soundEnabled ? "Activado" : "Desactivado"}</span>
          </button>
        </div>

        {/* Alarm Sounds - locked for free */}
        <div className="settings-section">
          <span className="settings-label">Alarma {!isPremium && <Lock size={12} style={{display:'inline',verticalAlign:'middle',marginLeft:4}} />}</span>
          {isPremium ? (
            <>
              <div className="alarm-grid">
                {ALARM_SOUNDS.map(s => (
                  <button key={s.id} className={`alarm-button ${alarmSound === s.id ? "active" : ""}`}
                    onClick={() => { setAlarmSound(s.id); playPreview(s.id); }} data-testid={`alarm-${s.id}`}>
                    {s.name}
                  </button>
                ))}
              </div>
              <button className="import-audio-btn" onClick={() => fileRef.current?.click()} data-testid="import-audio-btn">
                <Upload size={16} /> Importar audio
              </button>
              <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) alert(`Audio "${file.name}" importado (demo)`);
              }} data-testid="audio-file-input" />
            </>
          ) : (
            <div className="locked-feature" data-testid="locked-alarms">
              <Crown size={20} />
              <span>Desbloquea alarmas con Premium</span>
              <button className="unlock-btn" onClick={onUpgrade} data-testid="unlock-alarms-btn">Desbloquear</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
