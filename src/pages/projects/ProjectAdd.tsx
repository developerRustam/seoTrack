import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import  {useCreateProjectMutation} from '../../entities/project/api/projectsApi'

function isProbablyUrl(url: string) {
  const v = url.trim().toLowerCase();
  return v.startsWith("https://") || v.startsWith("http://");
}

export function ProjectAdd() {
  const navigate = useNavigate();
  const [createProject] = useCreateProjectMutation();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      !isSubmitting &&
      name.trim().length > 0 &&
      isProbablyUrl(url)
    );
  }, [name, url, isSubmitting]);

  return (
    <div className="page">
      <div className="panel">
        <div className="page__header">
          <div>
            <h1 className="page__title">Добавить проект</h1>
            <p className="page__subtitle">
              Добавь страницу магазина, которую будем мониторить.
            </p>
          </div>
        </div>

        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);

            if (!name.trim()) return setError("Введите название проекта");
            if (!isProbablyUrl(url)) return setError("URL должен начинаться с http:// или https://");

            setIsSubmitting(true);
            try {
              await createProject({
                name: name.trim(),
                url: url.trim(),
              }).unwrap();

              navigate("/projects", { replace: true });
            } catch (err) {
              if (err instanceof Error) {
                setError(err.message);
              } else {
                setError("Произошла неизвестная ошибка");
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label className="form__field">
            <span>Название проекта</span>
            <input
              type="text"
              placeholder="Checkout / Главная / Каталог"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              required
            />
          </label>

          <label className="form__field">
            <span>URL страницы</span>
            <input
              type="url"
              placeholder="https://shop.example.com/checkout"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              required
            />
            <div className="form__hint">Только http(s). Без авторизации. Пока мониторим публичные страницы.</div>
          </label>


          {error && (
            <div className="form__error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="button button--primary" disabled={!canSubmit}>
            {isSubmitting ? "Добавляем..." : "Добавить проект"}
          </button>
        </form>
      </div>
    </div>
  );
}
