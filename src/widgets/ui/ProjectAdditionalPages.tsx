import { useState } from "react";
import { useAddAdditionalPageMutation } from "../../entities/project/api/projectsApi";
import type { AdditionalPage } from "../../shared/types/project";

type ProjectAdditionalPagesProps = {
  projectId: string;
  additionalPages?: AdditionalPage[];
  selectedPageId: string | null;
  onSelectPage: (pageId: string | null) => void;
};

function isProbablyUrl(url: string) {
  const value = url.trim().toLowerCase();
  return value.startsWith("http://") || value.startsWith("https://");
}

export function ProjectAdditionalPages({
  projectId,
  additionalPages = [],
  selectedPageId,
  onSelectPage,
}: ProjectAdditionalPagesProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addAdditionalPage, { isLoading }] = useAddAdditionalPageMutation();

  function handleClose() {
    setOpen(false);
    setTitle("");
    setUrl("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle) {
      setError("Page title is required");
      return;
    }

    if (!isProbablyUrl(trimmedUrl)) {
      setError("URL must start with http:// or https://");
      return;
    }

    try {
      await addAdditionalPage({
        projectId,
        page: {
          id: crypto.randomUUID(),
          title: trimmedTitle,
          url: trimmedUrl,
          enabled: true,
          status: "ok",
          metrics: {
            desc: { lcp: 0, cls: 0, inp: 0, ttfb: 0, seoScore: 0 },
            mob: { lcp: 0, cls: 0, inp: 0, ttfb: 0, seoScore: 0 },
          },
          scripts: [],
        },
      }).unwrap();

      handleClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add page");
    }
  }

  return (
    <section className="panel">
      <div className="page__header">
        <div>
          <h2 className="page__title">Additional pages</h2>
          <p className="page__subtitle">
            Add extra URLs to track alongside the main project page.
          </p>
        </div>
        <button
          className="button button--primary project-additional-pages__add-btn"
          type="button"
          aria-label="Open add page popup"
          onClick={() => setOpen(true)}
        >
          +
        </button>
      </div>

      <div className="project-additional-pages">
        {additionalPages.length > 0 ? (
          <ul className="project-additional-pages__list">
            <li className="project-additional-pages__item-wrap">
              <button
                type="button"
                className={`project-additional-pages__item project-additional-pages__selector${
                  selectedPageId === null ? " project-additional-pages__selector--active" : ""
                }`}
                onClick={() => onSelectPage(null)}
              >
                <div>
                  <div className="project-additional-pages__title">Main page</div>
                  <span className="muted">Current project URL</span>
                </div>
              </button>
            </li>
            {additionalPages.map((page) => (
              <li key={page.id} className="project-additional-pages__item-wrap">
                <button
                  type="button"
                  className={`project-additional-pages__item project-additional-pages__selector${
                    selectedPageId === page.id ? " project-additional-pages__selector--active" : ""
                  }`}
                  onClick={() => onSelectPage(page.id)}
                >
                  <div>
                    <div className="project-additional-pages__title">{page.title}</div>
                    <a
                      className="project-additional-pages__url"
                      href={page.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {page.url}
                    </a>
                  </div>
                  <span className={`status status--${page.status}`}>{page.status}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <button
              type="button"
              className={`project-additional-pages__item project-additional-pages__selector${
                selectedPageId === null ? " project-additional-pages__selector--active" : ""
              }`}
              onClick={() => onSelectPage(null)}
            >
              <div>
                <div className="project-additional-pages__title">Main page</div>
                <span className="muted">Current project URL</span>
              </div>
            </button>
            <p className="muted">No additional pages yet.</p>
          </>
        )}
      </div>

      {open && (
        <div className="project-additional-pages__popup" role="presentation">
          <div className="project-additional-pages__overlay" onClick={handleClose} />
          <div
            className="project-additional-pages__modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="additional-pages-title"
          >
            <div className="page__header">
              <div>
                <h3 id="additional-pages-title" className="page__title">
                  Add page
                </h3>
                <p className="page__subtitle">
                  Add an extra URL for this project.
                </p>
              </div>
              <button
                className="button"
                type="button"
                aria-label="Close add page popup"
                onClick={handleClose}
              >
                x
              </button>
            </div>

            <form className="form project-additional-pages__form" onSubmit={handleSubmit}>
              <label className="form__field">
                <span>Page title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Category page"
                />
              </label>

              <label className="form__field">
                <span>Page URL</span>
                <input
                  type="url"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://example.com/category"
                />
              </label>

              {error && (
                <div className="form__error" role="alert">
                  {error}
                </div>
              )}

              <div className="project-additional-pages__actions">
                <button className="button" type="button" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className="button button--primary project-additional-pages__submit"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
