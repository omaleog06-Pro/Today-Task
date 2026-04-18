import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/App";
import axios from "axios";
import { Settings, Plus, Calendar, Clock, Bell, Trash2, Edit2, X, ArrowUpDown, ListTodo, Sparkles, Volume2, VolumeX, ChevronDown, ChevronUp, LogOut, Crown, BellRing } from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";
import SettingsModal from "@/components/SettingsModal";
import EditModal from "@/components/EditModal";
import AdBanner from "@/components/AdBanner";
import SubscriptionModal from "@/components/SubscriptionModal";
import { sendTasksToSW, clearReminderFromSW, onSWMessage, getNotificationPermission, requestNotificationPermission } from "@/utils/serviceWorker";

const FILTERS = [
  { id: "all", name: "Todas" },
  { id: "active", name: "Activas" },
  { id: "completed", name: "Completadas" },
];

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const isUpcoming = (dateString) => {
  if (!dateString) return false;
  const diff = new Date(dateString).getTime() - Date.now();
  return diff > 0 && diff <= 86400000;
};

const formatDateTime = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// Alarm sounds
const ALARM_SOUNDS = {
  "gentle-wake": { name: "Despertar Suave", freq: [440, 523, 659], duration: 0.3 },
  "morning-dew": { name: "Rocío Matinal", freq: [523, 659, 784], duration: 0.25 },
  "soft-chime": { name: "Campana Suave", freq: [659, 784, 880], duration: 0.2 },
  "calm-bell": { name: "Campana Calma", freq: [392, 494, 587], duration: 0.35 },
};

const playAlarmSound = (soundId) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const config = ALARM_SOUNDS[soundId] || ALARM_SOUNDS["gentle-wake"];
    config.freq.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * config.duration);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * config.duration);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i + 1) * config.duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * config.duration);
      osc.stop(ctx.currentTime + (i + 1) * config.duration);
    });
  } catch (e) { /* silent */ }
};

export default function TaskApp() {
  const { user, logout, refreshUser, API } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  const [filter, setFilter] = useState("all");
  const [theme, setTheme] = useState(user?.preferences?.theme || "light");
  const [font, setFont] = useState(user?.preferences?.font || "classic");
  const [soundEnabled, setSoundEnabled] = useState(user?.preferences?.sound_enabled !== false);
  const [alarmSound, setAlarmSound] = useState(user?.preferences?.alarm_sound || "gentle-wake");
  const notifiedRef = useRef(new Set());
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const { data } = await axios.get(`${API}/tasks`);
        setTasks(data);
      } catch { /* use empty */ }
    };
    loadTasks();
  }, [API]);

  // Sync tasks to Service Worker whenever tasks change
  useEffect(() => {
    sendTasksToSW(tasks);
  }, [tasks]);

  // Listen for SW messages (REMINDER_FIRED, COMPLETE_TASK)
  useEffect(() => {
    const unsubscribe = onSWMessage((msg) => {
      if (msg.type === 'REMINDER_FIRED') {
        const { id, title, notification_type } = msg.payload;
        if (!notifiedRef.current.has(id)) {
          notifiedRef.current.add(id);
          // Play alarm sound if applicable
          const nType = notification_type || 'both';
          if ((nType === 'alarm' || nType === 'both') && soundEnabled) {
            playAlarmSound(alarmSound);
          }
          // Show in-app notification
          setNotification({ id, title });
        }
      }
      if (msg.type === 'COMPLETE_TASK') {
        const { id } = msg.payload;
        toggleTask(id);
      }
    });
    return unsubscribe;
  }, [soundEnabled, alarmSound]);

  // Apply theme/font
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.setAttribute("data-font", font); }, [font]);

  // Save preferences
  const savePrefs = useCallback(async (prefs) => {
    try { await axios.put(`${API}/user/preferences`, prefs); } catch { /* ignore */ }
  }, [API]);

  const handleThemeChange = (t) => { setTheme(t); savePrefs({ theme: t, font, sound_enabled: soundEnabled, alarm_sound: alarmSound }); };
  const handleFontChange = (f) => { setFont(f); savePrefs({ theme, font: f, sound_enabled: soundEnabled, alarm_sound: alarmSound }); };
  const handleSoundChange = (s) => { setSoundEnabled(s); savePrefs({ theme, font, sound_enabled: s, alarm_sound: alarmSound }); };
  const handleAlarmChange = (a) => { setAlarmSound(a); savePrefs({ theme, font, sound_enabled: soundEnabled, alarm_sound: a }); };

  // Reminders - fallback for when SW is not available or tab is active
  const checkReminders = useCallback(() => {
    const now = Date.now();
    tasks.forEach((task) => {
      if (task.hasReminder && task.datetime && !task.completed && !notifiedRef.current.has(task.id)) {
        const diff = (new Date(task.datetime).getTime() - now) / 60000;
        if (diff <= 1 && diff > -60) {
          const nType = task.notification_type || "both";
          if (nType !== "none") {
            if ((nType === "alarm" || nType === "both") && soundEnabled) playAlarmSound(alarmSound);
            setNotification({ id: task.id, title: task.title });
            // Native notification fallback (if SW didn't fire it)
            if ((nType === "notification" || nType === "both") && "Notification" in window && window.Notification.permission === "granted") {
              new window.Notification("Today Task", { body: task.title, tag: `task-${task.id}` });
            }
          }
          notifiedRef.current.add(task.id);
          clearReminderFromSW(task.id);
        }
      }
    });
  }, [tasks, soundEnabled, alarmSound]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission().then(p => setNotifPermission(p));
  }, []);

  useEffect(() => {
    checkReminders();
    const iv = setInterval(checkReminders, 30000);
    return () => clearInterval(iv);
  }, [checkReminders]);

  // CRUD
  const addTask = async (taskData) => {
    const task = { id: generateId(), ...taskData, completed: false, createdAt: new Date().toISOString() };
    setTasks(prev => [task, ...prev]);
    try { await axios.post(`${API}/tasks`, task); } catch { /* local fallback */ }
  };

  const toggleTask = async (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    const task = tasks.find(t => t.id === id);
    try { await axios.put(`${API}/tasks/${id}`, { completed: !task?.completed }); } catch { /* ignore */ }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await axios.delete(`${API}/tasks/${id}`); } catch { /* ignore */ }
  };

  const updateTask = async (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTask(null);
    try { await axios.put(`${API}/tasks/${updated.id}`, updated); } catch { /* ignore */ }
  };

  // Check subscription from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      const pollStatus = async (attempts = 0) => {
        if (attempts >= 5) return;
        try {
          const { data } = await axios.get(`${API}/subscription/status/${sessionId}`);
          if (data.payment_status === "paid" || data.status === "paid") {
            await refreshUser();
            window.history.replaceState({}, "", "/");
            return;
          }
        } catch { /* ignore */ }
        setTimeout(() => pollStatus(attempts + 1), 2000);
      };
      pollStatus();
    }
  }, [API, refreshUser]);

  // Filter & sort
  const filtered = tasks.filter(t => filter === "active" ? !t.completed : filter === "completed" ? t.completed : true);
  const sorted = [...filtered].sort((a, b) => {
    if (sortByDate) {
      if (!a.datetime && !b.datetime) return 0;
      if (!a.datetime) return 1;
      if (!b.datetime) return -1;
      return new Date(a.datetime) - new Date(b.datetime);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const counts = { all: tasks.length, active: tasks.filter(t => !t.completed).length, completed: tasks.filter(t => t.completed).length };
  const isPremium = user?.is_premium;

  return (
    <div className="app-container" data-testid="app-container">
      <div className="app-content">
        {/* Header */}
        <header className="app-header">
          <h1 className="app-title" data-testid="app-title">
            <Sparkles size={24} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Today Task
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isPremium && (
              <button className="premium-btn" onClick={() => setShowSubscription(true)} data-testid="premium-btn">
                <Crown size={16} /> Pro
              </button>
            )}
            <button className="settings-btn" onClick={() => setShowSettings(true)} data-testid="settings-btn" title="Configuración">
              <Settings size={20} />
            </button>
            <button className="logout-btn" onClick={logout} data-testid="logout-btn" title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Notification Permission Banner */}
        {notifPermission !== 'granted' && (
          <div className="notif-banner" data-testid="notif-permission-banner">
            <BellRing size={18} />
            <span>Activa las notificaciones para recibir recordatorios en segundo plano</span>
            <button className="notif-banner-btn" onClick={async () => {
              const p = await requestNotificationPermission();
              setNotifPermission(p);
            }} data-testid="enable-notifications-btn">Activar</button>
          </div>
        )}

        {/* Task Form */}
        <TaskForm onAdd={addTask} isPremium={isPremium} />

        {/* Filters */}
        <div className="filter-tabs" data-testid="filter-tabs">
          {FILTERS.map(f => (
            <button key={f.id} className={`filter-tab ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)} data-testid={`filter-${f.id}`}>
              {f.name}<span className="filter-count">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="controls-bar">
          <div className="task-counter" data-testid="task-count">{counts.active} pendientes · {counts.completed} completadas</div>
          <div className="sort-controls">
            <button className={`sort-button ${!sortByDate ? "active" : ""}`} onClick={() => setSortByDate(false)} data-testid="sort-recent"><Clock size={14} />Recientes</button>
            <button className={`sort-button ${sortByDate ? "active" : ""}`} onClick={() => setSortByDate(true)} data-testid="sort-date"><ArrowUpDown size={14} />Por fecha</button>
          </div>
        </div>

        {/* Tasks */}
        {sorted.length > 0 ? (
          <div className="task-list" data-testid="task-list">
            {sorted.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={setEditingTask} />
            ))}
          </div>
        ) : (
          <div className="empty-state" data-testid="empty-state">
            <ListTodo className="empty-icon" size={56} />
            <h3 className="empty-title">{filter === "all" ? "¡Sin tareas!" : filter === "active" ? "¡Todo completado!" : "Sin completadas"}</h3>
            <p className="empty-description">{filter === "all" ? "Agrega tu primera tarea" : filter === "active" ? "No tienes tareas pendientes" : "Aún no has completado ninguna"}</p>
          </div>
        )}
      </div>

      {/* Ad Banner */}
      {!isPremium && <AdBanner />}

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} theme={theme} setTheme={handleThemeChange} font={font} setFont={handleFontChange}
          soundEnabled={soundEnabled} setSoundEnabled={handleSoundChange} alarmSound={alarmSound} setAlarmSound={handleAlarmChange} isPremium={isPremium}
          onUpgrade={() => { setShowSettings(false); setShowSubscription(true); }} />
      )}
      {showSubscription && <SubscriptionModal onClose={() => setShowSubscription(false)} />}
      {editingTask && <EditModal task={editingTask} onSave={updateTask} onClose={() => setEditingTask(null)} isPremium={isPremium} />}
      {notification && (
        <div className="notification-toast" data-testid="notification-toast">
          <Bell className="notification-icon" size={22} />
          <div className="notification-content"><p className="notification-title">¡Recordatorio!</p><p className="notification-message">{notification.title}</p></div>
          <button className="notification-close" onClick={() => setNotification(null)} data-testid="close-notification"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

// TaskForm
function TaskForm({ onAdd, isPremium }) {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [notifType, setNotifType] = useState("both");
  const [showOptions, setShowOptions] = useState(false);
  const optRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (optRef.current && !optRef.current.contains(e.target)) setShowOptions(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), datetime: datetime || null, hasReminder: !!datetime, notification_type: notifType });
    setTitle("");
    setDatetime("");
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} data-testid="task-form">
      <div className="task-input-row">
        <input type="text" className="task-input" placeholder="¿Qué es lo próximo?" value={title} onChange={e => setTitle(e.target.value)} data-testid="task-input" />
        <div className="options-dropdown" ref={optRef}>
          <button type="button" className="dropdown-arrow" onClick={() => setShowOptions(!showOptions)} data-testid="options-dropdown-btn">
            <svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {showOptions && (
            <div className="dropdown-menu" data-testid="options-dropdown-menu">
              <span className="dropdown-label">Notificaciones</span>
              {[{id:"both",label:"Ambas"},{id:"alarm",label:"Solo alarma"},{id:"notification",label:"Solo notificación"},{id:"none",label:"Ninguna"}].map(o => (
                <button key={o.id} type="button" className={`dropdown-item ${notifType === o.id ? "active" : ""}`}
                  onClick={() => { setNotifType(o.id); }} data-testid={`notif-type-${o.id}`}>{o.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <DateTimePicker value={datetime} onChange={setDatetime} />
      <button type="submit" className="add-button" data-testid="add-task-btn"><Plus size={18} /> Agregar</button>
    </form>
  );
}

// TaskItem
function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const upcoming = isUpcoming(task.datetime);
  return (
    <div className={`task-item task-enter ${task.completed ? "completed" : ""} ${upcoming ? "upcoming" : ""}`} data-testid={`task-item-${task.id}`}>
      <input type="checkbox" className="task-checkbox" checked={task.completed} onChange={() => onToggle(task.id)} data-testid={`task-checkbox-${task.id}`} />
      <div className="task-content">
        <p className="task-title-text">{task.title}</p>
        <div className="task-meta">
          {task.datetime && <span className={`task-datetime ${upcoming ? "upcoming" : ""}`}><Calendar size={13} />{formatDateTime(task.datetime)}</span>}
          {task.hasReminder && task.datetime && <span className={`reminder-badge ${upcoming ? "upcoming-pulse" : ""}`}><Bell size={11} />Recordatorio</span>}
        </div>
      </div>
      <div className="task-actions">
        <button className="action-button" onClick={() => onEdit(task)} data-testid={`edit-task-${task.id}`}><Edit2 size={16} /></button>
        <button className="action-button delete" onClick={() => onDelete(task.id)} data-testid={`delete-task-${task.id}`}><Trash2 size={16} /></button>
      </div>
    </div>
  );
}
