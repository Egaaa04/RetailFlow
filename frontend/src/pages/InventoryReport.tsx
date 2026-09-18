import { useEffect, useState } from "react";

import {
  getInventoryReport,
  type InventoryProductReport,
} from "../services/inventoryReportService";

import {
  getInventoryMovements,
  type InventoryMovement,
} from "../services/inventoryService";

import { getProducts } from "../services/productService";

function InventoryReport() {
  const [products, setProducts] = useState<
    InventoryProductReport[]
  >([]);

  const [movements, setMovements] = useState<
    InventoryMovement[]
  >([]);

  const [productFilter, setProductFilter] =
    useState("");

  const [movementType, setMovementType] =
    useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [productNames, setProductNames] =
    useState<Record<number, string>>({});

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        inventoryResult,
        movementResult,
        productResult,
      ] = await Promise.all([
        getInventoryReport(),
        getInventoryMovements(
          productFilter
            ? Number(productFilter)
            : undefined,
          movementType || undefined
        ),
        getProducts(),
      ]);

      if (!inventoryResult.success) {
        setError(
          "Laporan inventory tidak dapat dimuat."
        );
        return;
      }

      setProducts(
        inventoryResult.products
      );

      setMovements(
        movementResult.movements
      );

      const names: Record<number, string> = {};

      productResult.products.forEach(
        (product: {
          id: number;
          name: string;
        }) => {
          names[product.id] = product.name;
        }
      );

      setProductNames(names);
    } catch (error) {
      console.error(error);

      setError(
        "Tidak dapat memuat laporan inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleFilter = () => {
    loadReport();
  };

  const getMovementLabel = (
    type: string
  ) => {
    const labels: Record<string, string> = {
      PURCHASE: "Pembelian",
      SALE: "Penjualan",
      DAMAGE: "Kerusakan",
      ADJUSTMENT: "Penyesuaian",
      RETURN: "Pengembalian",
    };

    return labels[type] || type;
  };

  const getMovementClass = (
    type: string
  ) => {
    if (
      type === "PURCHASE" ||
      type === "RETURN"
    ) {
      return "movement-in";
    }

    if (
      type === "SALE" ||
      type === "DAMAGE"
    ) {
      return "movement-out";
    }

    return "movement-adjustment";
  };

  const lowStockProducts =
    products.filter(
      (product) =>
        product.current_stock
        <= product.minimum_stock
    );

  return (
    <div className="report-page">

      <div className="page-header">
        <div>
          <h1>Laporan Inventory</h1>

          <p>
            Monitoring stok dan riwayat pergerakan inventory
          </p>
        </div>
      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {loading ? (
        <p>Memuat laporan inventory...</p>
      ) : (
        <>
          <div className="report-summary">

            <div className="summary-card">
              <span>
                Total Produk
              </span>

              <strong>
                {products.length}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Total Stok
              </span>

              <strong>
                {products.reduce(
                  (total, product) =>
                    total +
                    product.current_stock,
                  0
                )}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Stok Menipis
              </span>

              <strong>
                {lowStockProducts.length}
              </strong>
            </div>

            <div className="summary-card">
              <span>
                Total Movement
              </span>

              <strong>
                {movements.length}
              </strong>
            </div>

          </div>

          <div className="report-table-container">

            <div className="section-header">
              <div>
                <h2>
                  Stok Produk
                </h2>

                <p>
                  Kondisi stok produk saat ini
                </p>
              </div>
            </div>

            <div className="table-wrapper">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>No</th>
                    <th>SKU</th>
                    <th>Produk</th>
                    <th>Stok</th>
                    <th>Minimum</th>
                    <th>Satuan</th>
                    <th>Status Stok</th>
                  </tr>
                </thead>

                <tbody>

                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                        }}
                      >
                        Belum ada data produk.
                      </td>
                    </tr>
                  ) : (
                    products.map(
                      (product, index) => {

                        const lowStock =
                          product.current_stock
                          <= product.minimum_stock;

                        return (
                          <tr
                            key={product.id}
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {product.sku}
                            </td>

                            <td>
                              {product.name}
                            </td>

                            <td>
                              {product.current_stock}
                            </td>

                            <td>
                              {product.minimum_stock}
                            </td>

                            <td>
                              {product.unit}
                            </td>

                            <td>
                              <span
                                className={
                                  lowStock
                                    ? "status-badge status-warning"
                                    : "status-badge status-success"
                                }
                              >
                                {lowStock
                                  ? "Stok Menipis"
                                  : "Aman"}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

          <div className="report-table-container">

            <div className="section-header">
              <div>
                <h2>
                  Riwayat Pergerakan Stok
                </h2>

                <p>
                  Catatan perubahan stok produk
                </p>
              </div>
            </div>

            <div className="report-filter">

              <div className="form-group">

                <label>
                  Produk
                </label>

                <select
                  value={productFilter}
                  onChange={(event) =>
                    setProductFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Semua Produk
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="form-group">

                <label>
                  Tipe Movement
                </label>

                <select
                  value={movementType}
                  onChange={(event) =>
                    setMovementType(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Semua Movement
                  </option>

                  <option value="PURCHASE">
                    Pembelian
                  </option>

                  <option value="SALE">
                    Penjualan
                  </option>

                  <option value="DAMAGE">
                    Kerusakan
                  </option>

                  <option value="ADJUSTMENT">
                    Penyesuaian
                  </option>

                  <option value="RETURN">
                    Pengembalian
                  </option>
                </select>

              </div>

              <button
                className="primary-button"
                onClick={handleFilter}
              >
                Terapkan Filter
              </button>

            </div>

            <div className="table-wrapper">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>No</th>
                    <th>Produk</th>
                    <th>Movement</th>
                    <th>Quantity</th>
                    <th>Stok Sebelum</th>
                    <th>Stok Sesudah</th>
                    <th>Catatan</th>
                    <th>Waktu</th>
                  </tr>
                </thead>

                <tbody>

                  {movements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                        }}
                      >
                        Belum ada riwayat movement.
                      </td>
                    </tr>
                  ) : (
                    movements.map(
                      (
                        movement,
                        index
                      ) => (
                        <tr
                          key={movement.id}
                        >
                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {productNames[
                              movement.product_id
                            ] ||
                              `Produk #${movement.product_id}`}
                          </td>

                          <td>
                            <span
                              className={`movement-badge ${getMovementClass(
                                movement.movement_type
                              )}`}
                            >
                              {getMovementLabel(
                                movement.movement_type
                              )}
                            </span>
                          </td>

                          <td>
                            {movement.quantity}
                          </td>

                          <td>
                            {movement.stock_before}
                          </td>

                          <td>
                            {movement.stock_after}
                          </td>

                          <td>
                            {movement.notes ||
                              "-"}
                          </td>

                          <td>
                            {new Date(
                              movement.created_at
                            ).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default InventoryReport;