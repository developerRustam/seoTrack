import React from "react";

export function ProjectAdditionalPages() {
  return (
    <div className="project-additional-pages">
      <div className="tabs">
        <div className="tab-list">
          <button type="button" className="tab-btn active">
            Главная
          </button>
          <button type="button" className="tab-btn">
            Категория
          </button>
          <button type="button" className="tab-btn">
            Контакты
          </button>
          <button type="button" className="add-tab-btn" title="Добавить страницу">
            +
          </button>
        </div>
      </div>
    </div>
  );
}
