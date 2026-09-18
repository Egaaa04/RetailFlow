import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Users from "./pages/Users";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import POS from "./pages/POS";
import Transactions from "./pages/Transactions";
import TransactionDetail from "./pages/TransactionDetail";
import SalesReport from "./pages/SalesReport";
import BestSellingProducts from "./pages/BestSellingProducts";
import InventoryReport from "./pages/InventoryReport";
import AuditLogs from "./pages/AuditLogs";
import RoleRoute from "./components/RoleRoute";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>

            {/* =========================
                SEMUA ROLE
                ========================= */}

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/pos"
              element={<POS />}
            />

            <Route
              path="/transactions"
              element={<Transactions />}
            />

            <Route
              path="/transactions/:transactionId"
              element={<TransactionDetail />}
            />

            <Route
                path="/settings"
                element={<Settings />}
              />

            {/* =========================
                OWNER + ADMIN
                ========================= */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "owner",
                    "admin",
                  ]}
                />
              }
            >

              <Route
                path="/products"
                element={<Products />}
              />

              <Route
                path="/categories"
                element={<Categories />}
              />

              <Route
                path="/inventory"
                element={<Inventory />}
              />

              <Route
                path="/suppliers"
                element={<Suppliers />}
              />

              <Route
                path="/purchases"
                element={<Purchases />}
              />

              <Route
                path="/reports/sales"
                element={<SalesReport />}
              />

              <Route
                path="/reports/products"
                element={<BestSellingProducts />}
              />

              <Route
                path="/reports/inventory"
                element={<InventoryReport />}
              />

            </Route>


            {/* =========================
                OWNER ONLY
                ========================= */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "owner",
                  ]}
                />
              }
            >

              <Route
                path="/users"
                element={<Users />}
              />

              <Route
                path="/audit-logs"
                element={<AuditLogs />}
              />

            </Route>

          </Route>

        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;