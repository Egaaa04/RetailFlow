import { useEffect, useState } from "react";
import {
  getDashboard,
  type DashboardResponse,
} from "../services/dashboardService";

function Dashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const formatRupiah = (
    value: number
  ) => {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  };

  const formatDate = (
    value: string
  ) => {
    return new Date(
      value
    ).toLocaleString("id-ID");
  };

  useEffect(() => {
    const fetchDashboard =
      async () => {
        try {
          setLoading(true);
          setError("");

          const result =
            await getDashboard();

          if (result.success) {
            setDashboard(result);
          } else {
            setError(
              "Gagal mengambil data dashboard."
            );
          }
        } catch (error) {
          console.error(error);

          setError(
            "Gagal mengambil data dashboard."
          );
        } finally {
          setLoading(false);
        }
      };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <h1>Dashboard</h1>

        <p>
          Memuat dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Dashboard</h1>

        <div className="login-error">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div>
        <h1>Dashboard</h1>

        <p>
          Data dashboard tidak tersedia.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="page-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Ringkasan aktivitas RetailFlow
          </p>
        </div>
      </div>

      <div className="dashboard-cards">

        <div className="dashboard-card">
          <span>
            Penjualan Hari Ini
          </span>

          <strong>
            {formatRupiah(
              Number(
                dashboard.summary
                  .today_sales
              )
            )}
          </strong>
        </div>

        <div className="dashboard-card">
          <span>
            Transaksi Hari Ini
          </span>

          <strong>
            {
              dashboard.summary
                .today_transactions
            }
          </strong>
        </div>

        <div className="dashboard-card">
          <span>
            Produk Aktif
          </span>

          <strong>
            {
              dashboard.summary
                .active_products
            }
          </strong>
        </div>

        <div className="dashboard-card">
          <span>
            Stok Menipis
          </span>

          <strong>
            {
              dashboard.summary
                .low_stock_products
            }
          </strong>
        </div>

      </div>

      <div className="dashboard-grid dashboard-stack">

        <section className="dashboard-section">

          <div className="section-header">
            <h2>
              Transaksi Terbaru
            </h2>
          </div>

          <div className="table-container">

            <table>
              <thead>
                <tr>
                  <th>
                    No. Transaksi
                  </th>

                  <th>
                    Kasir
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Pembayaran
                  </th>

                  <th>
                    Waktu
                  </th>
                </tr>
              </thead>

              <tbody>

                {dashboard
                  .recent_transactions
                  .length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign:
                          "center",
                      }}
                    >
                      Belum ada
                      transaksi.
                    </td>
                  </tr>
                ) : (
                  dashboard
                    .recent_transactions
                    .map(
                      (
                        transaction
                      ) => (
                        <tr
                          key={
                            transaction.id
                          }
                        >
                          <td>
                            {
                              transaction
                                .transaction_number
                            }
                          </td>

                          <td>
                            {
                              transaction
                                .cashier_name
                            }
                          </td>

                          <td>
                            {formatRupiah(
                              Number(
                                transaction
                                  .total_amount
                              )
                            )}
                          </td>

                          <td>
                            {
                              transaction
                                .payment_method
                            }
                          </td>

                          <td>
                            {formatDate(
                              transaction
                                .created_at
                            )}
                          </td>
                        </tr>
                      )
                    )
                )}

              </tbody>
            </table>

          </div>

        </section>

        <section className="dashboard-section">

          <div className="section-header">
            <h2>
              Stok Menipis
            </h2>
          </div>

          <div className="table-container">

            <table>
              <thead>
                <tr>
                  <th>
                    Produk
                  </th>

                  <th>
                    SKU
                  </th>

                  <th>
                    Stok
                  </th>

                  <th>
                    Minimum
                  </th>
                </tr>
              </thead>

              <tbody>

                {dashboard
                  .low_stock_list
                  .length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign:
                          "center",
                      }}
                    >
                      Tidak ada
                      stok menipis.
                    </td>
                  </tr>
                ) : (
                  dashboard
                    .low_stock_list
                    .map(
                      (product) => (
                        <tr
                          key={
                            product.id
                          }
                        >
                          <td>
                            {
                              product.name
                            }
                          </td>

                          <td>
                            {
                              product.sku
                            }
                          </td>

                          <td>
                            {
                              product
                                .current_stock
                            }{" "}
                            {
                              product.unit
                            }
                          </td>

                          <td>
                            {
                              product
                                .minimum_stock
                            }{" "}
                            {
                              product.unit
                            }
                          </td>
                        </tr>
                      )
                    )
                )}

              </tbody>
            </table>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Dashboard;

