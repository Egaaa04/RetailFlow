import { useEffect, useState } from "react";
import {
  getTransactionDetail,
  type TransactionDetail as TransactionDetailType,
} from "../services/transactionService";
import { useNavigate, useParams } from "react-router-dom";

function TransactionDetail() {
  const { transactionId } =
    useParams();

  const navigate = useNavigate();

  const [transaction, setTransaction] =
    useState<TransactionDetailType | null>(
      null
    );

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
    const fetchDetail =
      async () => {
        try {
          if (!transactionId) {
            return;
          }

          const result =
            await getTransactionDetail(
              Number(transactionId)
            );

          if (result.success) {
            setTransaction(
              result.transaction
            );
          }
        } catch (error) {
          console.error(error);

          setError(
            "Gagal mengambil detail transaksi."
          );
        } finally {
          setLoading(false);
        }
      };

    fetchDetail();
  }, [transactionId]);

  if (loading) {
    return (
      <div>
        <h1>Detail Transaksi</h1>
        <p>
          Memuat data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Detail Transaksi</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div>
        <h1>Detail Transaksi</h1>
        <p>
          Transaksi tidak ditemukan.
        </p>
      </div>
    );
  }

  return (
    <div className="transaction-detail">

      <div className="page-header">
        <div>
          <h1>
            Detail Transaksi
          </h1>

          <p>
            {
              transaction.transaction_number
            }
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() =>
              navigate(
                "/transactions"
              )
            }
          >
            Kembali
          </button>

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            style={{
              marginLeft: "8px",
            }}
          >
            Print Struk
          </button>
        </div>
      </div>

      <div
        className="receipt"
        id="receipt"
      >

        <div className="receipt-header">
          <h2>RetailFlow</h2>

          <p>
            Retail Point of Sale
          </p>

          <p>
            Jl. Contoh No. 123
          </p>

          <hr />

          <p>
            {
              transaction.transaction_number
            }
          </p>

          <p>
            {formatDate(
              transaction.created_at
            )}
          </p>

          <p>
            Kasir:{" "}
            {
              transaction.cashier_name
            }
          </p>
        </div>

        <div className="receipt-items">

          {transaction.items.map(
            (item) => (
              <div
                className="receipt-item"
                key={item.id}
              >
                <div>
                  <strong>
                    {
                      item.product_name
                    }
                  </strong>

                  <p>
                    {item.quantity} ×{" "}
                    {formatRupiah(
                      Number(
                        item.selling_price
                      )
                    )}
                  </p>
                </div>

                <strong>
                  {formatRupiah(
                    Number(
                      item.subtotal
                    )
                  )}
                </strong>
              </div>
            )
          )}

        </div>

        <hr />

        <div className="receipt-summary">

          <div>
            <span>
              Subtotal
            </span>

            <strong>
              {formatRupiah(
                Number(
                  transaction.subtotal
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Diskon
            </span>

            <strong>
              {formatRupiah(
                Number(
                  transaction.discount
                )
              )}
            </strong>
          </div>

          <div className="receipt-total">
            <span>
              Total
            </span>

            <strong>
              {formatRupiah(
                Number(
                  transaction.total_amount
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Pembayaran
            </span>

            <strong>
              {formatRupiah(
                Number(
                  transaction.payment_amount
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Kembalian
            </span>

            <strong>
              {formatRupiah(
                Number(
                  transaction.change_amount
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Metode
            </span>

            <strong>
              {
                transaction.payment_method
              }
            </strong>
          </div>

        </div>

        <hr />

        <div className="receipt-footer">
          <p>
            Terima kasih atas
            kunjungan Anda.
          </p>

          <p>
            Barang yang sudah dibeli
            tidak dapat dikembalikan
            tanpa ketentuan yang berlaku.
          </p>
        </div>

      </div>

    </div>
  );
}

export default TransactionDetail;