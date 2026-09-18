import { useEffect, useState } from "react";

import {
  getInventoryMovements,
  createInventoryMovement,
  type InventoryMovement,
} from "../services/inventoryService";

import {
  getProducts,
  type Product,
} from "../services/productService";


function Inventory() {
  const [
    movements,
    setMovements
  ] = useState<InventoryMovement[]>([]);

  const [
    products,
    setProducts
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  // =========================
  // ADJUSTMENT STATE
  // =========================

  const [
    selectedProduct,
    setSelectedProduct
  ] = useState("");

  const [
    actualStock,
    setActualStock
  ] = useState("");

  const [
    adjustmentNotes,
    setAdjustmentNotes
  ] = useState("");

  const [
    adjustmentLoading,
    setAdjustmentLoading
  ] = useState(false);

  const [
    adjustmentError,
    setAdjustmentError
  ] = useState("");

  const [
    adjustmentSuccess,
    setAdjustmentSuccess
  ] = useState("");


  // =========================
  // LOAD DATA
  // =========================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        movementResult,
        productResult
      ] = await Promise.all([
        getInventoryMovements(),
        getProducts()
      ]);

      if (movementResult.success) {
        setMovements(
          movementResult.movements
        );
      }

      if (productResult.success) {
        setProducts(
          productResult.products
        );
      }

    } catch (error) {
      console.error(error);

      setError(
        "Gagal mengambil data inventory."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  // =========================
  // ADJUSTMENT
  // =========================

  const handleAdjustment = async () => {
    setAdjustmentError("");
    setAdjustmentSuccess("");

    if (!selectedProduct) {
      setAdjustmentError(
        "Produk wajib dipilih."
      );
      return;
    }

    if (actualStock === "") {
      setAdjustmentError(
        "Stok aktual wajib diisi."
      );
      return;
    }

    const actualStockNumber =
      Number(actualStock);

    if (
      !Number.isInteger(actualStockNumber) ||
      actualStockNumber < 0
    ) {
      setAdjustmentError(
        "Stok aktual harus berupa angka bulat dan tidak boleh negatif."
      );
      return;
    }

    try {
      setAdjustmentLoading(true);

      await createInventoryMovement({
        product_id: Number(selectedProduct),
        movement_type: "ADJUSTMENT",
        actual_stock: actualStockNumber,
        notes:
          adjustmentNotes || undefined,
      });

      setAdjustmentSuccess(
        "Adjustment stok berhasil dicatat."
      );

      setSelectedProduct("");
      setActualStock("");
      setAdjustmentNotes("");

      await loadData();

    } catch (error) {
      console.error(error);

      setAdjustmentError(
        "Adjustment stok gagal dilakukan."
      );
    } finally {
      setAdjustmentLoading(false);
    }
  };


  // =========================
  // HELPER
  // =========================

  const getProductName = (
    productId: number
  ) => {
    const product = products.find(
      (item) =>
        item.id === productId
    );

    return product
      ? product.name
      : "-";
  };


  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleString(
      "id-ID"
    );
  };


  // =========================
  // RENDER
  // =========================

  return (
    <div>

      <div className="page-header">

        <div>
          <h1>Inventory</h1>

          <p>
            Pantau pergerakan stok produk.
          </p>
        </div>

      </div>


      {error && (
        <div className="login-error">
          {error}
        </div>
      )}


      {/* =========================
          ADJUSTMENT
      ========================= */}

      <div className="inventory-adjustment">

        <div className="section-header">

          <div>

            <h2>
              Penyesuaian Stok
            </h2>

            <p>
              Sesuaikan stok sistem dengan jumlah stok fisik
            </p>

          </div>

        </div>


        {adjustmentError && (
          <div className="login-error">
            {adjustmentError}
          </div>
        )}


        {adjustmentSuccess && (
          <div className="success-message">
            {adjustmentSuccess}
          </div>
        )}


        <div className="adjustment-form">

          <div className="form-group">

            <label htmlFor="adjustment-product">
              Produk
            </label>

            <select
              id="adjustment-product"
              value={selectedProduct}
              onChange={(event) =>
                setSelectedProduct(
                  event.target.value
                )
              }
              disabled={adjustmentLoading}
            >

              <option value="">
                Pilih Produk
              </option>

              {products.map(
                (product: Product) => (

                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} - Stok:{" "}
                    {product.current_stock}
                  </option>

                )
              )}

            </select>

          </div>


          <div className="form-group">

            <label htmlFor="actual-stock">
              Stok Aktual
            </label>

            <input
              id="actual-stock"
              type="number"
              min="0"
              value={actualStock}
              onChange={(event) =>
                setActualStock(
                  event.target.value
                )
              }
              placeholder="Contoh: 17"
              disabled={adjustmentLoading}
            />

          </div>


          <div className="form-group">

            <label htmlFor="adjustment-notes">
              Catatan
            </label>

            <input
              id="adjustment-notes"
              type="text"
              value={adjustmentNotes}
              onChange={(event) =>
                setAdjustmentNotes(
                  event.target.value
                )
              }
              placeholder="Contoh: Hasil pengecekan stok fisik"
              disabled={adjustmentLoading}
            />

          </div>


          <button
            type="button"
            className="primary-button"
            onClick={handleAdjustment}
            disabled={adjustmentLoading}
          >
            {adjustmentLoading
              ? "Menyimpan..."
              : "Simpan Adjustment"}
          </button>

        </div>

      </div>


      {/* =========================
          MOVEMENT TABLE
      ========================= */}

      <div className="table-card">

        <div className="section-header">

          <div>

            <h2>
              Riwayat Pergerakan Stok
            </h2>

            <p>
              Catatan perubahan stok produk.
            </p>

          </div>

        </div>


        {loading ? (

          <p>
            Memuat inventory...
          </p>

        ) : movements.length === 0 ? (

          <p>
            Belum ada pergerakan stok.
          </p>

        ) : (

          <table>

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Produk
                </th>

                <th>
                  Tipe
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Stok Sebelum
                </th>

                <th>
                  Stok Sesudah
                </th>

                <th>
                  Catatan
                </th>

                <th>
                  Waktu
                </th>

              </tr>

            </thead>


            <tbody>

              {movements.map(
                (movement) => (

                  <tr
                    key={movement.id}
                  >

                    <td>
                      {movement.id}
                    </td>

                    <td>
                      {getProductName(
                        movement.product_id
                      )}
                    </td>

                    <td>
                      {movement.movement_type}
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
                      {formatDate(
                        movement.created_at
                      )}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

export default Inventory;