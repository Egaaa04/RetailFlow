import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  logout,
} from "../utils/auth";

function Settings() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "cashier":
        return "Kasir";
      default:
        return role || "-";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h1>Pengaturan</h1>
          <p>
            Informasi akun dan pengaturan sesi pengguna
          </p>
        </div>
      </div>

      <div className="settings-grid">

        <div className="settings-card">

          <div className="settings-card-header">
            <h2>Informasi Akun</h2>
            <p>
              Informasi pengguna yang sedang login
            </p>
          </div>

          <div className="settings-list">

            <div className="settings-item">
              <span className="settings-label">
                Nama
              </span>

              <span className="settings-value">
                {user?.name || "-"}
              </span>
            </div>

            <div className="settings-item">
              <span className="settings-label">
                Email
              </span>

              <span className="settings-value">
                {user?.email || "-"}
              </span>
            </div>

            <div className="settings-item">
              <span className="settings-label">
                Role
              </span>

              <span className="settings-value">
                {getRoleLabel(user?.role)}
              </span>
            </div>

            <div className="settings-item">
              <span className="settings-label">
                Status
              </span>

              <span className="status-badge status-success">
                Aktif
              </span>
            </div>

          </div>

        </div>


        <div className="settings-card">

          <div className="settings-card-header">
            <h2>Sesi</h2>
            <p>
              Kelola sesi login RetailFlow
            </p>
          </div>

          <div className="settings-session">

            <p>
              Gunakan tombol di bawah untuk
              mengakhiri sesi pada perangkat ini.
            </p>

            <button
              type="button"
              className="danger-button"
              onClick={handleLogout}
            >
              Keluar dari RetailFlow
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Settings;