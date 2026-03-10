import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register, AuthError, type AuthErrorCode } from "../../shared/storage/authStore";
import { useAuth } from "../../shared/auth/useAuth";
import closeEye from '../../assets/closeEye.png'
import openEye from '../../assets/openEye.png'

const ERROR_TEXT: Record<AuthErrorCode, string> = {
  EMAIL_TAKEN: "Этот email уже зарегистрирован",
  INVALID_CREDENTIALS: "Неверный email или пароль",
  VALIDATION: "Проверьте введённые данные",
  NO_SESSION: "Сессия истекла, войдите снова",
  UNKNOWN: "Что-то пошло не так. Попробуйте снова.",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [typeEye, setTypeEye]  = useState<'open' | 'close'>('close')
  const nameError = !nameTouched
  ? null : name.trim().length === 0 ? "Name is required" : name.trim().length < 3 ? "Name must be at least 3 characters" : null;
  
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = !emailTouched
  ? null : email.trim().length === 0 ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Invalid email format" : null;
  
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const passwordError = !passwordTouched
  ? null : password.trim().length === 0 ? "Password is required" : password.trim().length < 6 ? "Password must be at least 6 characters" : null;

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    !!name.trim() &&
    !!email.trim() &&
    !!password &&
    !isSubmitting &&
    !nameError &&
    !emailError &&
    !passwordError;
    
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true); 

    setIsSubmitting(true);
    try {
      await register(email, password, name);
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
            <h1 className="page__title">Create account</h1>
            <p className="page__subtitle">
              Sign up to start monitoring your stores.
            </p>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="form__field">
            <span>Name</span>
            <div className="form__field-wrap">
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              onBlur={() => setNameTouched(true)}
              placeholder="John Doe"
              autoComplete="name"
            />
            {nameTouched && nameError && (
              <div className="form__error" role="alert">
                {nameError}
              </div>
            )}
            </div>
          </label>

          <label className="form__field">
            <span>Email</span>
            <div className="form__field-wrap">
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
              autoComplete="email"
             
            />
            {emailError &&  emailTouched && (
              <div className="form__error" role="alert">
                {emailError}
              </div>
            )}
            </div>
          </label>

          <label className="form__field">
            <span>Password</span>
            <div className="form__field-wrap">
            <input
              type={typeEye === 'open' ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError(null);
              }}
              onBlur={() => setPasswordTouched(true)}
              placeholder="min 6 characters"
              autoComplete="new-password"
            />
            <img className="form__field-eye" src={typeEye=== 'open' ? openEye : closeEye} alt="" onClick={()=>  setTypeEye((prev)=> prev === 'open' ? 'close' : 'open')} />
            {passwordError && passwordTouched && (
              <div className="form__error" role="alert">
                {passwordError}
              </div>
            )}
            </div>
          </label>
          {error && (
            <div className="form__error" role="alert">
              {error}
            </div>
          )}
          <button formNoValidate type="submit" className="button button--primary" disabled={!canSubmit}>
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
