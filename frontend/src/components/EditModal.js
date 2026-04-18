import { useState } from "react";
import { X } from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";

export default function EditModal({ task, onSave, onClose, isPremium }) {
  const [title, setTitle] = useState(task?.title || "");
  const [datetime, setDatetime] = useState(task?.datetime || "");
  const [hasReminder, setHasReminder] = useState(task?.hasReminder || false);
  const [notifType, setNotifType] = useState(task?.notification_type || "both");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ ...task, title: title.trim(), datetime: datetime || null, hasReminder: hasReminder && !!datetime, notification_type: notifType });
  };

  return (
    <div className="modal-overlay edit-modal" onClick={onClose} data-testid="edit-modal">
      <div className="modal-content modal-enter" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} data-testid="close-edit-btn"><X size={18} /></button>
        <h2 className="modal-title">Editar Tarea</h2>
        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input type="text" className="task-input" value={title} onChange={e => setTitle(e.target.value)} data-testid="edit-title-input" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <DateTimePicker value={datetime} onChange={setDatetime} />
          </div>
          <div className="form-group form-checkbox-group">
            <input type="checkbox" id="reminder-toggle" className="task-checkbox" checked={hasReminder} onChange={e => setHasReminder(e.target.checked)} data-testid="edit-reminder-toggle" />
            <label htmlFor="reminder-toggle" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Activar recordatorio</label>
          </div>
          {hasReminder && (
            <div className="form-group">
              <label className="form-label">Tipo de aviso</label>
              <div className="notif-options">
                {[{id:"both",label:"Ambas"},{id:"alarm",label:"Solo alarma"},{id:"notification",label:"Solo notificación"},{id:"none",label:"Ninguna"}].map(o => (
                  <button key={o.id} type="button" className={`notif-option ${notifType === o.id ? "active" : ""}`}
                    onClick={() => setNotifType(o.id)} data-testid={`edit-notif-${o.id}`}>{o.label}</button>
                ))}
              </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose} data-testid="cancel-edit-btn">Cancelar</button>
            <button type="submit" className="save-button" data-testid="save-edit-btn">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
