import { useEffect, useState } from "react";

import {
  getSuppliers,
} from "../services/supplierService";

import {
  getProducts,
} from "../services/productService";

import {
  createPurchase,
  getPurchaseDetail,
  getPurchases,
  receivePurchase,
} from "../services/purchaseService";

interface Supplier {
  id: number;
  name: string;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  purchase_price: number;
  current_stock: number;
}

interface PurchaseItemForm {
  product_id: number;
  quantity: number;
  purchase_price: number;
}

interface Purchase {
  id: number;
  purchase_number: string;
  supplier_name: string;
  purchase_date: string;
  status: string;
  total_amount: number;
}

interface PurchaseDetail {
  id: number;
  purchase_number: string;
  supplier_name: string;
  purchase_date: string;
  status: string;
  total_amount: number;
  items: {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    purchase_price: number;
    subtotal: number;
  }[];
}

function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [supplierId, setSupplierId] =
    useState<number | "">("");

  const [purchaseDate, setPurchaseDate] =
    useState(
      new Date().toISOString().split("T")[0]
    );

  const [items, setItems] = useState<
    PurchaseItemForm[]
  >([
    {
      product_id: 0,
      quantity: 1,
      purchase_price: 0,
    },
  ]);

  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseDetail | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const fetchData = async () => {
    try {
      const [
        purchaseResult,
        supplierResult,
        productResult,
      ] = await Promise.all([
        getPurchases(),
        getSuppliers(),
        getProducts(),
      ]);

      if (purchaseResult.success) {
        setPurchases(
          purchaseResult.purchases
        );
      }

      if (supplierResult.success) {
        setSuppliers(
          supplierResult.suppliers
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
        "Gagal mengambil data pembelian."
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: 0,
        quantity: 1,
        purchase_price: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      return;
    }

    setItems(
      items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  const updateItem = (
    index: number,
    field: keyof PurchaseItemForm,
    value: number
  ) => {
    const newItems = [...items];

    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    if (
      field === "product_id"
    ) {
      const product = products.find(
        (item) =>
          item.id === value
      );

      if (product) {
        newItems[index].purchase_price =
          Number(product.purchase_price);
      }
    }

    setItems(newItems);
  };

  const calculateSubtotal = (
    item: PurchaseItemForm
  ) => {
    return (
      item.quantity *
      item.purchase_price
    );
  };

  const total = items.reduce(
    (sum, item) =>
      sum + calculateSubtotal(item),
    0
  );

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (supplierId === "") {
      setError(
        "Supplier wajib dipilih."
      );
      return;
    }

    const invalidItem = items.some(
      (item) =>
        item.product_id === 0 ||
        item.quantity <= 0 ||
        item.purchase_price < 0
    );

    if (invalidItem) {
      setError(
        "Data item pembelian belum lengkap."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await createPurchase({
          supplier_id: supplierId,
          purchase_date: purchaseDate,
          items,
        });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(
        "Purchase berhasil dibuat."
      );

      setSupplierId("");

      setItems([
        {
          product_id: 0,
          quantity: 1,
          purchase_price: 0,
        },
      ]);

      await fetchData();

    } catch (error: any) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
        "Gagal membuat purchase."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = async (
    purchaseId: number
  ) => {
    try {
      const result =
        await getPurchaseDetail(
          purchaseId
        );

      if (result.success) {
        setSelectedPurchase(
          result.purchase
        );
      }

    } catch (error) {
      console.error(error);

      setError(
        "Gagal mengambil detail purchase."
      );
    }
  };

  const handleReceive = async (
    purchaseId: number
  ) => {
    const confirmed =
      window.confirm(
        "Apakah barang dari purchase ini sudah benar-benar diterima?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const result =
        await receivePurchase(
          purchaseId
        );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(
        "Purchase berhasil diterima dan stok telah diperbarui."
      );

      setSelectedPurchase(null);

      await fetchData();

    } catch (error: any) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
        "Gagal menerima purchase."
      );
    }
  };

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

  return (
    <div>

      <h1>Pembelian</h1>

      <p>
        Kelola pembelian barang dari supplier.
      </p>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {message && (
        <p>{message}</p>
      )}

      {/* FORM PURCHASE */}

      <div className="form-card">

        <h2>
          Buat Purchase
        </h2>

        <div className="form-group">

          <label>
            Supplier
          </label>

          <select
            value={supplierId}
            onChange={(event) =>
              setSupplierId(
                event.target.value
                  ? Number(
                      event.target.value
                    )
                  : ""
              )
            }
          >
            <option value="">
              Pilih Supplier
            </option>

            {suppliers
              .filter(
                (supplier) =>
                  supplier.is_active
              )
              .map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              ))}
          </select>

        </div>

        <div className="form-group">

          <label>
            Tanggal Pembelian
          </label>

          <input
            type="date"
            value={purchaseDate}
            onChange={(event) =>
              setPurchaseDate(
                event.target.value
              )
            }
          />

        </div>

        <h3>
          Item Pembelian
        </h3>

        {items.map(
          (item, index) => (
            <div
              key={index}
              style={{
                border:
                  "1px solid #ddd",
                padding: "15px",
                marginBottom:
                  "10px",
              }}
            >

              <div className="form-group">

                <label>
                  Produk
                </label>

                <select
                  value={
                    item.product_id
                  }
                  onChange={(event) =>
                    updateItem(
                      index,
                      "product_id",
                      Number(
                        event.target.value
                      )
                    )
                  }
                >

                  <option value={0}>
                    Pilih Produk
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={product.id}
                        value={
                          product.id
                        }
                      >
                        {product.name} (
                        {product.sku})
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Harga Beli
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    item.purchase_price
                  }
                  onChange={(event) =>
                    updateItem(
                      index,
                      "purchase_price",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    item.quantity
                  }
                  onChange={(event) =>
                    updateItem(
                      index,
                      "quantity",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <p>
                Subtotal:{" "}
                <strong>
                  {formatRupiah(
                    calculateSubtotal(
                      item
                    )
                  )}
                </strong>
              </p>

              <button
                type="button"
                onClick={() =>
                  removeItem(index)
                }
                disabled={
                  items.length === 1
                }
              >
                Hapus Item
              </button>

            </div>
          )
        )}

        <button
          type="button"
          onClick={addItem}
        >
          + Tambah Item
        </button>

        <h2>
          Total:{" "}
          {formatRupiah(total)}
        </h2>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Menyimpan..."
            : "Simpan Purchase"}
        </button>

      </div>

      {/* DETAIL PURCHASE */}

      {selectedPurchase && (
        <div className="table-card">

          <h2>
            Detail Purchase
          </h2>

          <p>
            <strong>
              Nomor:
            </strong>{" "}
            {selectedPurchase.purchase_number}
          </p>

          <p>
            <strong>
              Supplier:
            </strong>{" "}
            {selectedPurchase.supplier_name}
          </p>

          <p>
            <strong>
              Tanggal:
            </strong>{" "}
            {selectedPurchase.purchase_date}
          </p>

          <p>
            <strong>
              Status:
            </strong>{" "}
            {selectedPurchase.status}
          </p>

          <table>

            <thead>
              <tr>
                <th>
                  Produk
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Harga Beli
                </th>

                <th>
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody>

              {selectedPurchase.items.map(
                (item) => (
                  <tr key={item.id}>

                    <td>
                      {item.product_name}
                    </td>

                    <td>
                      {item.quantity}
                    </td>

                    <td>
                      {formatRupiah(
                        item.purchase_price
                      )}
                    </td>

                    <td>
                      {formatRupiah(
                        item.subtotal
                      )}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

          <h3>
            Total:{" "}
            {formatRupiah(
              selectedPurchase.total_amount
            )}
          </h3>

          {selectedPurchase.status ===
            "DRAFT" && (
            <button
              onClick={() =>
                handleReceive(
                  selectedPurchase.id
                )
              }
            >
              Receive / Terima Barang
            </button>
          )}

          <button
            onClick={() =>
              setSelectedPurchase(null)
            }
          >
            Tutup Detail
          </button>

        </div>
      )}

      {/* LIST PURCHASE */}

      <div className="table-card">

        <h2>
          Daftar Pembelian
        </h2>

        <table>

          <thead>
            <tr>
              <th>
                Nomor
              </th>

              <th>
                Supplier
              </th>

              <th>
                Tanggal
              </th>

              <th>
                Total
              </th>

              <th>
                Status
              </th>

              <th>
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>

            {purchases.map(
              (purchase) => (
                <tr
                  key={purchase.id}
                >

                  <td>
                    {
                      purchase.purchase_number
                    }
                  </td>

                  <td>
                    {
                      purchase.supplier_name
                    }
                  </td>

                  <td>
                    {
                      purchase.purchase_date
                    }
                  </td>

                  <td>
                    {formatRupiah(
                      purchase.total_amount
                    )}
                  </td>

                  <td>
                    {purchase.status}
                  </td>

                  <td>

                    <button
                      onClick={() =>
                        handleDetail(
                          purchase.id
                        )
                      }
                    >
                      Detail
                    </button>

                  </td>

                </tr>
              )
            )}

            {purchases.length === 0 && (
              <tr>
                <td colSpan={6}>
                  Belum ada pembelian.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Purchases;