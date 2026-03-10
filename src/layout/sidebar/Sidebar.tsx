import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { useAuth } from "../../shared/auth/useAuth";

export function Sidebar() {
  const { user, loading,  logout} = useAuth();
  const navigate = useNavigate();


  return (
    <div className={styles.sidebarWrap}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>PM</div>
        <div className={styles.brandText}>
          <div className={styles.brandName}>Perf Monitor</div>
          <div className={styles.brandTag}>E-commerce performance alerts</div>
        </div>
      </div>

      <div className={styles.sectionTitle}>Workspace</div>
      <nav className={styles.nav}>
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
          }
        >
          Projects
        </NavLink>
        <NavLink
          to="/projects/add"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
          }
        >
          Add project
        </NavLink>
      </nav>

    

      <div className={styles.footer}>
        <div className={styles.sectionTitle}>Account</div>
        {loading ? (
          <div className={styles.userEmail}>Loading...</div>
        ) : user ? (
          <div className={styles.userBlock}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userEmail}>{user.email}</div>
            <button className="button button--ghost" type="button" onClick={async() => {await logout(); navigate('/login')}}>
              Logout
            </button>
          </div>
        ) : (
          <nav className={styles.nav}>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Register
            </NavLink>
          </nav>
        )}
      </div>
    </aside>
    </div>
  );
}
