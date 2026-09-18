import { useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getCurrentUser,
  hasRole,
  logout,
} from "../utils/auth";

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = getCurrentUser();

  const [reportOpen, setReportOpen] =
    useState(
      location.pathname.startsWith("/reports")
    );

  const isReportActive =
    location.pathname.startsWith("/reports");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-layout">

      <aside className="sidebar">

        <div className="sidebar-logo">
          <h2>RetailFlow</h2>
          <span>Retail Management</span>
        </div>

        <nav className="sidebar-menu">

          {/* Semua Role */}
          <Link to="/">
            Dashboard
          </Link>

          {/* Owner + Admin */}
          {hasRole(["owner", "admin"]) && (
            <>
              <Link to="/products">
                Produk
              </Link>

              <Link to="/categories">
                Kategori
              </Link>

              <Link to="/inventory">
                Inventory
              </Link>

              <Link to="/suppliers">
                Supplier
              </Link>

              <Link to="/purchases">
                Pembelian
              </Link>
            </>
          )}

          {/* Semua Role */}
          <Link to="/pos">
            POS
          </Link>

          <Link to="/transactions">
            Transaksi
          </Link>

          {/* Owner + Admin */}
          {hasRole(["owner", "admin"]) && (
            <div className="sidebar-dropdown">

              <button
                type="button"
                className={`sidebar-dropdown-button ${
                  isReportActive
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setReportOpen(!reportOpen)
                }
              >
                <span>Laporan</span>

                <span>
                  {reportOpen
                    ? "▾"
                    : "▸"}
                </span>
              </button>

              {reportOpen && (
                <div className="sidebar-submenu">

                  <Link
                    to="/reports/sales"
                    className={
                      location.pathname ===
                      "/reports/sales"
                        ? "active"
                        : ""
                    }
                  >
                    Laporan Penjualan
                  </Link>

                  <Link
                    to="/reports/products"
                    className={
                      location.pathname ===
                      "/reports/products"
                        ? "active"
                        : ""
                    }
                  >
                    Produk Terlaris
                  </Link>

                  <Link
                    to="/reports/inventory"
                    className={
                      location.pathname ===
                      "/reports/inventory"
                        ? "active"
                        : ""
                    }
                  >
                    Laporan Inventory
                  </Link>

                </div>
              )}

            </div>
          )}

        </nav>

        <div className="sidebar-bottom">

          {/* Owner Only */}
          {hasRole(["owner"]) && (
            <>
              <Link to="/users">
                Pengguna
              </Link>

              <Link to="/audit-logs">
                Audit Log
              </Link>
            </>
          )}
            <Link to="/settings">
                Pengaturan
            </Link>
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            Keluar
          </button>

        </div>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div>
            <h3>RetailFlow</h3>
          </div>

          <div className="user-info">
            <span>
              {user?.name || "User"}
            </span>

            <span className="user-role">
              {user?.role || ""}
            </span>
          </div>

        </header>

        <section className="page-content">
          <Outlet />
        </section>

      </main>

    </div>
  );
}

export default MainLayout;