import { useEffect, useState } from "react";
import type { ProjectMetricConfig } from "../../lib/projectMetrics";
import styles from "./ProjectSettingsPopup.module.css";
import { useUpdateProjectSettingsMutation } from "../../../entities/project/api/projectsApi";
type Values = {
  id: string;
  name: string;
  url: string;
  checkFrequency?: "HOURLY"| "6H" | "12H" | "DAILY" | "WEEKLY" | "MONTHLY";
};
type ProjectSettingsPopupProps = {
  open: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
  initialValues?:Values;
};


export function ProjectSettingsPopup({ open, onClose, onSubmit, initialValues }: ProjectSettingsPopupProps) {
  if (!open) return null;
  const [draft, setDraft] = useState<Values>(initialValues);
  const [updateSettings, { isLoading }] = useUpdateProjectSettingsMutation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft?.id) return;
    console.log('dsfasdfsdafsad');
    try {
      await updateSettings({
        projectId: draft.id,
        name: draft.name,
        url: draft.url,
        checkFrequency: draft.checkFrequency ?? "DAILY",
      }).unwrap();
      
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (open) setDraft(initialValues);
  }, [open, initialValues]);

  return (
    <div className={styles.projectSettingsPopup}>
      <div className={styles.projectSettingsPopup__overlay} onClick={handleSave} />
      <div className={styles.projectSettingsPopup__window} role="dialog" aria-modal="true">
        <button
          className={styles.projectSettingsPopup__close}
          type="button"
          aria-label="Close settings popup"
          onClick={onClose}
        >
          x
        </button>

        <div className={styles.projectSettingsPopup__header}>
          <h2 className={styles.projectSettingsPopup__title}>Project settings</h2>
          <p className={styles.projectSettingsPopup__subtitle}>
            Configure base options for the current project.
          </p>
        </div>

        <form className={styles.projectSettingsPopup__form} onSubmit={handleSave}>
          <label className={styles.projectSettingsPopup__field}>
            <span className={styles.projectSettingsPopup__label}>Project name</span>
            <input
              className={styles.projectSettingsPopup__input}
              type="text"
              value={draft.name}
              name="name"
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Storefront"
            />
          </label>

          <label className={styles.projectSettingsPopup__field}>
            <span className={styles.projectSettingsPopup__label}>Website URL</span>
            <input
              className={styles.projectSettingsPopup__input}
              type="url"
              name="url"
              value={draft.url}
              onChange={(e) => setDraft((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://example.com"
            />
          </label>

          <label className={styles.projectSettingsPopup__field}>
            <span className={styles.projectSettingsPopup__label}>Check frequency</span>
            <select
              className={styles.projectSettingsPopup__input}
              name="checkFrequency"
              value={draft.checkFrequency}
              onChange={(e) =>
                setDraft((p) => ({ ...p, checkFrequency: e.target.value }))
              }
            >
              <option value="HOURLY">Every hour</option>
              <option value="EVERY_6_HOURS">Every 6 hours</option>
              <option value="EVERY_12_HOURS">Every 12 hours</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>

          <label className={styles.projectSettingsPopup__checkbox}>
            <input type="checkbox" name="notificationsEnabled" />
            <span>Enable notifications</span>
          </label>

          <div className={styles.projectSettingsPopup__actions}>
            <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={onClose}>
              Cancel
            </button>
            <button className={styles.button} type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
