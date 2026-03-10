import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, AuthError, type AuthErrorCode } from "../../shared/storage/authStore";
import closeEye from '../../assets/closeEye.png'
import openEye from '../../assets/openEye.png'
import { useAuth } from "../../shared/auth/useAuth";

const ERROR_TEXT: Record<AuthErrorCode, string> = {
  EMAIL_TAKEN: "Этот email уже зарегистрирован",
  INVALID_CREDENTIALS: "Неверный email или пароль",
  VALIDATION: "Проверьте введённые данные",
  NO_SESSION: "Сессия истекла, войдите снова",
  UNKNOWN: "Что-то пошло не так. Попробуйте снова.",
};

export function LoginPage() {
  const navigate = useNavigate();
  const { refresh} = useAuth();
  const [email, setEmail] = useState("");
  const [typeEye, setTypeEye] = useState<'open' | 'close'>('close');
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError =  !emailTouched
  ? null : email.trim().length === 0 ? "Email обязателен" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Неверный формат email" : null;
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = !!email.trim() && !!password && !isSubmitting && !emailError;
  async function handeSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      await refresh();
      navigate("/projects", { replace: true });
    } catch (e) {
      if (e instanceof AuthError) setError(ERROR_TEXT[e.code] ?? e.message);
      else setError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="page">
      <div className="panel">
        <div className="page__header">
          <div>
            <h1 className="page__title">Welcome back</h1>
            <p className="page__subtitle">
              Sign in to keep an eye on your SEO and performance alerts.
            </p>
          </div>
        </div>

        <form
          className="form"
          onSubmit={handeSubmit}
        >
          <label className="form__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onBlur={() => setEmailTouched(true)}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              required
              autoFocus
              autoComplete="email"
            />
           
            {emailError && (
              <div className="form__error">{emailError}</div>
            )}
          </label>

          <label className="form__field">
            <span>Password</span>
            
            <div className="form__field-wrap">
            <input
              type={typeEye === 'close' ?"password": 'text'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError(null);
              }}
              placeholder="********"
              required
              autoComplete="current-password"
            />
             <img className="form__field-eye" src={typeEye=== 'open' ? openEye : closeEye} alt="" 
              onClick={() => setTypeEye((prev)=> prev === 'open' ? 'close' : 'open')}/>
             </div>
          </label>

          {error && <div className="form__error" role="alert">{error}</div>}

          <button type="submit" className="button button--primary" disabled={!canSubmit}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <div className="form__hint">
            <Link to='/register'>Зарегестрироваться</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
