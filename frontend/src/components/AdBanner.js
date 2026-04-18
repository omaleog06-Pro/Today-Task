import { useState, useEffect } from "react";
import { X } from "lucide-react";

const FAKE_ADS = [
  { title: "TaskPro Cloud", desc: "Sincroniza tus tareas en todos tus dispositivos", color: "#3B82F6", img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&h=80&fit=crop" },
  { title: "FocusTimer", desc: "Técnica Pomodoro para mejorar tu productividad", color: "#10B981", img: "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=120&h=80&fit=crop" },
  { title: "MindCalm App", desc: "Meditación guiada para reducir el estrés", color: "#8B5CF6", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&h=80&fit=crop" },
  { title: "NoteBook Pro", desc: "Organiza tus notas de forma inteligente", color: "#F59E0B", img: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=120&h=80&fit=crop" },
  { title: "WorkFlow Plus", desc: "Gestión de proyectos simplificada", color: "#EC4899", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=120&h=80&fit=crop" },
  { title: "LearnCode", desc: "Aprende programación desde cero", color: "#06B6D4", img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=120&h=80&fit=crop" },
];

export default function AdBanner() {
  const [visible, setVisible] = useState(false);
  const [ad, setAd] = useState(null);

  useEffect(() => {
    const showAd = () => {
      const randomAd = FAKE_ADS[Math.floor(Math.random() * FAKE_ADS.length)];
      setAd(randomAd);
      setVisible(true);
    };

    // Show first ad after 30 seconds
    const initialTimer = setTimeout(showAd, 30000);

    // Then every 90 seconds
    const interval = setInterval(showAd, 90000);

    return () => { clearTimeout(initialTimer); clearInterval(interval); };
  }, []);

  if (!visible || !ad) return null;

  return (
    <div className="ad-banner slide-up" data-testid="ad-banner">
      <div className="ad-content">
        <img src={ad.img} alt={ad.title} className="ad-image" />
        <div className="ad-text">
          <span className="ad-badge" style={{ backgroundColor: ad.color }}>Anuncio</span>
          <p className="ad-title">{ad.title}</p>
          <p className="ad-desc">{ad.desc}</p>
        </div>
      </div>
      <button className="ad-close" onClick={() => setVisible(false)} data-testid="close-ad"><X size={14} /></button>
    </div>
  );
}
