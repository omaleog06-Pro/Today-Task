import { useState } from "react";
import { useAuth } from "@/App";
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const { login, register, formatApiError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); setSubmitting(false); return; }
        await register(email, password, name);
      }
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="auth-page" data-testid="auth-page">
      <div className="auth-card modal-enter" data-testid="auth-card">
        <div className="auth-header">
          <Sparkles size={32} />
          <h1>Today Task</h1>
        </div>
        <p className="auth-subtitle">{isLogin ? "Inicia sesión para continuar" : "Crea tu cuenta gratis"}</p>

        <form onSubmit={handleSubmit} className="auth-form" data-testid="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <User size={18} className="auth-icon" />
              <input type="text" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} data-testid="auth-name-input" />
            </div>
          )}
          <div className="auth-field">
            <Mail size={18} className="auth-icon" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required data-testid="auth-email-input" />
          </div>
          <div className="auth-field">
            <Lock size={18} className="auth-icon" />
            <input type={showPw ? "text" : "password"} placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required data-testid="auth-password-input" />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} data-testid="toggle-password">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="auth-error" data-testid="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={submitting} data-testid="auth-submit-btn">
            {submitting ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Registrarse"}
          </button>
        </form>

        <div className="auth-toggle">
          <span>{isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}</span>
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }} data-testid="auth-toggle-btn">
            {isLogin ? "Regístrate" : "Inicia Sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
