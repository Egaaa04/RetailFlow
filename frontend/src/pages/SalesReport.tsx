import { useState } from "react";
import {
  getSalesReport,
  type SalesReportResponse,
} from "../services/reportService";

function SalesReport() {
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const [startDate, setStartDate] =
    useState(today);

  const [endDate, setEndDate] =
    useState(today);

  const [report, setReport] =
    useState<SalesReportResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

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

  const handleGenerateReport =
    async () => {
      setError("");

      if (!startDate || !endDate) {
        setError(
          "Tanggal mulai dan tanggal akhir wajib diisi."
        );
        return;
      }

      if (startDate > endDate) {
        setError(
          "Tanggal mulai tidak boleh melebihi tanggal akhir."
        );
        return;
      }

      try {
        setLoading(true);

        const result =
          await getSalesReport(
            startDate,
            endDate
          );

        if (result.success) {
          setReport(result);
        }
      } catch (error: any) {
        console.error(error);

        setError(
          error?.response?.data?.detail ||
            "Gagal mengambil laporan penjualan."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div>

      <div className="page-header">
        <div>
          <h1>
            Laporan Penjualan
          </h1>

          <p>
            Analisis transaksi penjualan
            berdasarkan periode
          </p>
        </div>
      </div>

      <div className="report-filter">

        <div className="form-group">
          <label>
            Tanggal Mulai
          </label>

          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(
                event.target.value
              )
            }
          />
        </div>

        <div className="form-group">
          <label>
            Tanggal Akhir
          </label>

          <input
            type="date"
            value={endDate}
            onChange={(event) =>
              setEndDate(
                event.target.value
              )
            }
          />
        </div>

        <button
          type="button"
          onClick={
            handleGenerateReport
          }
          disabled={loading}
        >
          {loading
            ? "Memuat..."
            : "Tampilkan Laporan"}
        </button>

      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="dashboard-cards">

            <div className="dashboard-card">
              <span>
                Total Penjualan
              </span>

              <strong>
                {formatRupiah(
                  Number(
                    report.summary
                      .total_sales
                  )
                )}
              </strong>
            </div>

            <div className="dashboard-card">
              <span>
                Total Transaksi
              </span>

              <strong>
                {
                  report.summary
                    .total_transactions
                }
              </strong>
            </div>

            <div className="dashboard-card">
              <span>
                Item Terjual
              </span>

              <strong>
                {
                  report.summary
                    .total_items
                }
              </strong>
            </div>

            <div className="dashboard-card">
              <span>
                Estimasi Profit Kotor
              </span>

              <strong>
                {formatRupiah(
                  Number(
                    report.summary
                      .total_profit
                  )
                )}
              </strong>
            </div>

          </div>

          <div className="report-summary-extra">

            <div>
              <span>
                Total Diskon
              </span>

              <strong>
                {formatRupiah(
                  Number(
                    report.summary
                      .total_discount
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Periode
              </span>

              <strong>
                {report.period.start_date}
                {" - "}
                {report.period.end_date}
              </strong>
            </div>

          </div>

          <div className="table-container report-table">

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
                    Subtotal
                  </th>

                  <th>
                    Diskon
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Pembayaran
                  </th>

                  <th>
                    Profit
                  </th>

                  <th>
                    Waktu
                  </th>
                </tr>
              </thead>

              <tbody>

                {report.transactions
                  .length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign:
                          "center",
                      }}
                    >
                      Tidak ada transaksi
                      pada periode ini.
                    </td>
                  </tr>
                ) : (
                  report.transactions.map(
                    (transaction) => (
                      <tr
                        key={
                          transaction.id
                        }
                      >
                        <td>
                          {
                            transaction.transaction_number
                          }
                        </td>

                        <td>
                          {
                            transaction.cashier_name
                          }
                        </td>

                        <td>
                          {formatRupiah(
                            Number(
                              transaction.subtotal
                            )
                          )}
                        </td>

                        <td>
                          {formatRupiah(
                            Number(
                              transaction.discount
                            )
                          )}
                        </td>

                        <td>
                          {formatRupiah(
                            Number(
                              transaction.total_amount
                            )
                          )}
                        </td>

                        <td>
                          {
                            transaction.payment_method
                          }
                        </td>

                        <td>
                          {formatRupiah(
                            Number(
                              transaction.profit
                            )
                          )}
                        </td>

                        <td>
                          {formatDate(
                            transaction.created_at
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>
        </>
      )}

    </div>
  );
}

export default SalesReport;