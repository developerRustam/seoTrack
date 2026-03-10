
import type { CheckRun, ScriptInfo } from "../../shared/types/run";

export  function  ProjectScriptsList({
    currentCheckRun
  }: {
    currentCheckRun: CheckRun | undefined;
  }) {
    return (
        <div className="panel">
        
        {Array.isArray(currentCheckRun?.scripts) && currentCheckRun.scripts.length > 0 ? (
          <>
          <h2 className="section__header">Сторонние и внутренние скрипты</h2>
            <ul className="scripts-list project-details__rows">
              {currentCheckRun.scripts.map((script:ScriptInfo, idx: number) => (
                <li key={script.url ?? idx} className="scripts-list__item">
                  <div className="issues-list__item">
                    <div className="scripts-list__domain">
                      <b>{script.domain}</b>
                    </div>
                    <div className="scripts-list__main issues-list__key">
                      <span
                        className={`scripts-list__type scripts-list__type--${script.type}`}
                        title={
                          script.type === "third-party" ? "Сторонний" : "Внутренний"
                        }
                      >
                        {script.type === "third-party" ? "Сторонний" : "Внутренний"}
                      </span>
                    </div>
                    <div className="scripts-list__desc">
                      <span className="scripts-list__impact">
                        <b>+{script.impactMs}мс</b>
                      </span>
                    </div>
                  </div>
                  <div className="scripts-list__impact-desc">
                    {script.impactDescription}
                  </div>
                </li>
              ))}
            </ul>
            </>
          ) : (
            <div className="panel__empty">Нет подключённых скриптов.</div>
          )}
        </div>
    )
}