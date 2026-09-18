import { useEffect, useState } from "react";
import {
  getTransactions,
  type Transaction,
} from "../services/transactionService";
import { useNavigate } from "react-router-dom";

function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

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

  const fetchTransactions =
    async () => {
      try {
        setLoading(true);

        const result =
          await getTransactions();

        if (result.success) {
          setTransactions(
            result.transactions
          );
        }
      } catch (error) {
        console.error(error);

        setError(
          "Gagal mengambil data transaksi."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div>
        <h1>Transaksi</h1>
        <p>
          Memuat data transaksi...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transaksi</h1>

          <p>
            Riwayat transaksi penjualan
          </p>
        </div>
      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>No. Transaksi</th>
              <th>Kasir</th>
              <th>Total</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                  }}
                >
                  Belum ada transaksi.
                </td>
              </tr>
            ) : (
              transactions.map(
                (transaction) => (
                  <tr
                    key={transaction.id}
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
                      {
                        transaction.status
                      }
                    </td>

                    <td>
                      {formatDate(
                        transaction.created_at
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/transactions/${transaction.id}`
                          )
                        }
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Transactions;