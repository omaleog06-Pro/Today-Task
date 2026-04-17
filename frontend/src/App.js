import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { Settings, Plus, Calendar, Clock, Bell, Trash2, Edit2, X, CheckCircle, ArrowUpDown, ListTodo } from "lucide-react";

// Constants
const THEMES = [
  { id: "light", name: "Claro" },
  { id: "dark", name: "Oscuro" },
  { id: "corporate_blue", name: "Azul Corporativo" },
  { id: "nature_green", name: "Verde Naturaleza" },
];

const FONTS = [
  { id: "modern", name: "Moderna", preview: "Outfit" },
  { id: "classic", name: "Clásica", preview: "Work Sans" },
  { id: "technical", name: "Técnica", preview: "IBM Plex Sans" },
];

// Helper functions
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const isUpcoming = (dateString) => {
  if (!dateString) return false;
  const taskDate = new Date(dateString);
  const now = new Date();
  const diff = taskDate.getTime() - now.getTime();
  const hoursUntil = diff / (1000 * 60 * 60);
  return hoursUntil > 0 && hoursUntil <= 24;
};

const formatDateTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// SettingsPanel Component
const SettingsPanel = ({ theme, setTheme, font, setFont, isMobile, onClose }) => (
  <aside className={isMobile ? "settings-panel-mobile" : "settings-panel"} data-testid="settings-panel">
    {isMobile && (
      <button className="close-settings" onClick={onClose} data-testid="close-settings-btn">
        <X size={24} />
      </button>
    )}
    
    <div className="settings-section">
      <span className="settings-label">Tema</span>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`theme-button ${theme === t.id ? "active" : ""}`}
            onClick={() => setTheme(t.id)}
            data-testid={`theme-${t.id}`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
    
    <div className="settings-section">
      <span className="settings-label">Tipografía</span>
      <div className="font-list">
        {FONTS.map((f) => (
          <button
            key={f.id}
            className={`font-button ${font === f.id ? "active" : ""}`}
            onClick={() => setFont(f.id)}
            style={{ fontFamily: f.preview }}
            data-testid={`font-${f.id}`}
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  </aside>
);

// TaskForm Component
const TaskForm = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onAdd({
      id: generateId(),
      title: title.trim(),
      datetime: datetime || null,
      hasReminder: !!datetime,
      completed: false,
      createdAt: new Date().toISOString()
    });
    
    setTitle("");
    setDatetime("");
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} data-testid="task-form">
      <div className="form-row">
        <input
          type="text"
          className="task-input"
          placeholder="¿Qué necesitas hacer hoy?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="task-input"
        />
        <input
          type="datetime-local"
          className="datetime-input"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          data-testid="datetime-input"
        />
        <button type="submit" className="add-button" data-testid="add-task-btn">
          <Plus size={18} />
          Agregar
        </button>
      </div>
    </form>
  );
};

// TaskItem Component
const TaskItem = ({ task, onToggle, onDelete, onEdit }) => {
  const upcoming = isUpcoming(task.datetime);
  
  return (
    <li 
      className={`task-item task-enter ${task.completed ? "completed" : ""} ${upcoming ? "upcoming" : ""}`}
      data-testid={`task-item-${task.id}`}
    >
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        data-testid={`task-checkbox-${task.id}`}
      />
      
      <div className="task-content">
        <p className={`task-title ${task.completed ? "task-completed" : ""}`}>
          <span className="task-title">{task.title}</span>
        </p>
        
        <div className="task-meta">
          {task.datetime && (
            <span className={`task-datetime ${upcoming ? "upcoming" : ""}`}>
              <Calendar size={12} />
              {formatDateTime(task.datetime)}
            </span>
          )}
          
          {task.hasReminder && task.datetime && (
            <span className={`reminder-badge ${upcoming ? "upcoming-pulse" : ""}`}>
              <Bell size={12} />
              Recordatorio
            </span>
          )}
        </div>
      </div>
      
      <div className="task-actions">
        <button 
          className="action-button" 
          onClick={() => onEdit(task)}
          title="Editar"
          data-testid={`edit-task-${task.id}`}
        >
          <Edit2 size={16} />
        </button>
        <button 
          className="action-button delete" 
          onClick={() => onDelete(task.id)}
          title="Eliminar"
          data-testid={`delete-task-${task.id}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
};

// EditModal Component
const EditModal = ({ task, onSave, onClose }) => {
  const [title, setTitle] = useState(task?.title || "");
  const [datetime, setDatetime] = useState(task?.datetime || "");
  const [hasReminder, setHasReminder] = useState(task?.hasReminder || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSave({
      ...task,
      title: title.trim(),
      datetime: datetime || null,
      hasReminder: hasReminder && !!datetime
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="edit-modal">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Editar Tarea</h2>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de la tarea</label>
            <input
              type="text"
              className="task-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="edit-title-input"
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Fecha y hora</label>
            <input
              type="datetime-local"
              className="datetime-input"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              data-testid="edit-datetime-input"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="reminder-toggle"
              className="task-checkbox"
              checked={hasReminder}
              onChange={(e) => setHasReminder(e.target.checked)}
              data-testid="edit-reminder-toggle"
            />
            <label htmlFor="reminder-toggle" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
              Activar recordatorio
            </label>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose} data-testid="cancel-edit-btn">
              Cancelar
            </button>
            <button type="submit" className="save-button" data-testid="save-edit-btn">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Notification Component
const Notification = ({ notification, onClose }) => (
  <div className="notification-toast" data-testid="notification-toast">
    <Bell className="notification-icon" size={20} />
    <div className="notification-content">
      <p className="notification-title">¡Recordatorio!</p>
      <p className="notification-message">{notification.title}</p>
    </div>
    <button className="notification-close" onClick={onClose} data-testid="close-notification">
      <X size={16} />
    </button>
  </div>
);

// Main App Component
function App() {
  // State
  const [tasks, setTasks] = useState([]);
  const [theme, setTheme] = useState("light");
  const [font, setFont] = useState("modern");
  const [editingTask, setEditingTask] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  
  const notifiedTasksRef = useRef(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("todayTaskTasks");
    const savedTheme = localStorage.getItem("todayTaskTheme");
    const savedFont = localStorage.getItem("todayTaskFont");
    const savedNotified = localStorage.getItem("todayTaskNotified");
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedTheme) setTheme(savedTheme);
    if (savedFont) setFont(savedFont);
    if (savedNotified) notifiedTasksRef.current = new Set(JSON.parse(savedNotified));
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("todayTaskTasks", JSON.stringify(tasks));
  }, [tasks]);

  // Save theme to localStorage and apply
  useEffect(() => {
    localStorage.setItem("todayTaskTheme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Save font to localStorage and apply
  useEffect(() => {
    localStorage.setItem("todayTaskFont", font);
    document.documentElement.setAttribute("data-font", font);
  }, [font]);

  // Check for reminders
  const checkReminders = useCallback(() => {
    const now = new Date();
    
    tasks.forEach((task) => {
      if (
        task.hasReminder &&
        task.datetime &&
        !task.completed &&
        !notifiedTasksRef.current.has(task.id)
      ) {
        const taskTime = new Date(task.datetime);
        const diff = taskTime.getTime() - now.getTime();
        const minutesUntil = diff / (1000 * 60);
        
        // Notify if task is due within 1 minute or past due
        if (minutesUntil <= 1 && minutesUntil > -60) {
          setNotification({ id: task.id, title: task.title });
          notifiedTasksRef.current.add(task.id);
          localStorage.setItem(
            "todayTaskNotified",
            JSON.stringify([...notifiedTasksRef.current])
          );
          
          // Play notification sound if supported
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Today Task - Recordatorio", {
              body: task.title,
              icon: "/favicon.ico"
            });
          }
        }
      }
    });
  }, [tasks]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Set up reminder interval
  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkReminders]);

  // Task handlers
  const addTask = (task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const updateTask = (updatedTask) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
    setEditingTask(null);
  };

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortByDate) {
      if (!a.datetime && !b.datetime) return 0;
      if (!a.datetime) return 1;
      if (!b.datetime) return -1;
      return new Date(a.datetime) - new Date(b.datetime);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="app-container" data-testid="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title" data-testid="app-title">Today Task</h1>
          <button
            className="settings-toggle lg:hidden"
            onClick={() => setShowMobileSettings(true)}
            data-testid="mobile-settings-toggle"
          >
            <Settings size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-layout">
        {/* Desktop Settings Panel */}
        <div className="hidden lg:block">
          <SettingsPanel
            theme={theme}
            setTheme={setTheme}
            font={font}
            setFont={setFont}
          />
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          {/* Task Form */}
          <TaskForm onAdd={addTask} />

          {/* Sort Controls */}
          <div className="sort-controls">
            <button
              className={`sort-button ${!sortByDate ? "active" : ""}`}
              onClick={() => setSortByDate(false)}
              data-testid="sort-recent"
            >
              <Clock size={14} />
              Recientes
            </button>
            <button
              className={`sort-button ${sortByDate ? "active" : ""}`}
              onClick={() => setSortByDate(true)}
              data-testid="sort-date"
            >
              <ArrowUpDown size={14} />
              Por fecha
            </button>
          </div>

          {/* Task List */}
          <div className="task-list" data-testid="task-list">
            <div className="task-list-header">
              <span className="task-count" data-testid="task-count">
                {pendingCount} pendientes · {completedCount} completadas
              </span>
            </div>

            {sortedTasks.length > 0 ? (
              <ul className="task-items">
                {sortedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    onEdit={setEditingTask}
                  />
                ))}
              </ul>
            ) : (
              <div className="empty-state" data-testid="empty-state">
                <ListTodo className="empty-icon" size={48} />
                <h3 className="empty-title">No hay tareas</h3>
                <p className="empty-description">
                  Agrega tu primera tarea para comenzar a organizar tu día
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Settings Panel */}
      {showMobileSettings && (
        <SettingsPanel
          theme={theme}
          setTheme={setTheme}
          font={font}
          setFont={setFont}
          isMobile={true}
          onClose={() => setShowMobileSettings(false)}
        />
      )}

      {/* Edit Modal */}
      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={updateTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <Notification
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
