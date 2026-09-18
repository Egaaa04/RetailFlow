import { useEffect, useState } from "react";
import {
  getProductReport,
  type ProductReport,
} from "../services/productReportService";

function BestSellingProducts() {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [products, setProducts] = useState<ProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getProductReport(
        startDate,
        endDate
      );

      if (!result.success) {
        setError(
          "Data laporan produk tidak dapat dimuat."
        );
        return;
      }

      setProducts(result.products);
    } catch (error) {
      console.error(error);
      setError(
        "Tidak dapat memuat laporan produk."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleFilter = () => {
    if (startDate > endDate) {
      setError(
        "Tanggal awal tidak boleh lebih besar dari tanggal akhir."
      );
      return;
    }

    loadReport();
  };

  const totalQuantity = products.reduce(
    (total, product) =>
      total + product.total_quantity,
    0
  );

  const totalSales = products.reduce(
    (total, product) =>
      total + product.total_sales,
    0
  );

  const totalProfit = products.reduce(
    (total, product) =>
      total + product.total_profit,
    0
  );

  return (
    <div className="report-page">
      <div className="page-header">
        <div>
          <h1>Produk Terlaris</h1>
          <p>
            Analisis penjualan dan profit berdasarkan produk
          </p>
        </div>
      </div>

      <div className="report-filter">
        <div className="form-group">
          <label htmlFor="start-date">
            Tanggal Mulai
          </label>

          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="end-date">
            Tanggal Akhir
          </label>

          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(event) =>
              setEndDate(event.target.value)
            }
          />
        </div>

        <button
          className="primary-button"
          onClick={handleFilter}
        >
          Terapkan Filter
        </button>
      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      <div className="report-summary">
        <div className="summary-card">
          <span>Total Produk Terjual</span>
          <strong>{products.length}</strong>
        </div>

        <div className="summary-card">
          <span>Total Quantity</span>
          <strong>{totalQuantity}</strong>
        </div>

        <div className="summary-card">
          <span>Total Penjualan</span>
          <strong>
            {formatRupiah(totalSales)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Total Profit</span>
          <strong>
            {formatRupiah(totalProfit)}
          </strong>
        </div>
      </div>

      <div className="report-table-container">
        <div className="section-header">
          <div>
            <h2>Detail Produk</h2>
            <p>
              Diurutkan berdasarkan jumlah produk terjual
            </p>
          </div>
        </div>

        {loading ? (
          <p>Memuat laporan...</p>
        ) : products.length === 0 ? (
          <p>
            Tidak ada data penjualan pada periode ini.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>SKU</th>
                  <th>Produk</th>
                  <th>Qty Terjual</th>
                  <th>Total Penjualan</th>
                  <th>Profit</th>
                </tr>
              </thead>

              <tbody>
                {products.map(
                  (product, index) => (
                    <tr key={product.product_id}>
                      <td>{index + 1}</td>

                      <td>
                        {product.sku}
                      </td>

                      <td>
                        {product.product_name}
                      </td>

                      <td>
                        {product.total_quantity}
                      </td>

                      <td>
                        {formatRupiah(
                          product.total_sales
                        )}
                      </td>

                      <td>
                        {formatRupiah(
                          product.total_profit
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BestSellingProducts;