import { useEffect, useMemo, useState } from "react";
import {
  createTransaction,
  getPOSProducts,
} from "../services/posService";

interface Product {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  selling_price: number;
  current_stock: number;
  status: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentAmount, setPaymentAmount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const result = await getPOSProducts();

        if (result.success) {
          setProducts(result.products);
        }
      } catch (error) {
        console.error(error);
        setError("Gagal mengambil data produk.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword) ||
        product.barcode?.toLowerCase().includes(keyword)
      );
    });
  }, [products, search]);

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return (
        total +
        item.product.selling_price *
          item.quantity
      );
    }, 0);
  }, [cart]);

  const total = Math.max(
    subtotal - discount,
    0
  );

  const change = Math.max(
    paymentAmount - total,
    0
  );

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

  const addToCart = (product: Product) => {
    setError("");
    setSuccess("");

    if (product.current_stock <= 0) {
      setError(
        `Stok ${product.name} habis.`
      );
      return;
    }

    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (item) =>
            item.product.id === product.id
        );

      if (existingItem) {
        if (
          existingItem.quantity >=
          product.current_stock
        ) {
          setError(
            `Stok ${product.name} tidak mencukupi.`
          );

          return currentCart;
        }

        return currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (
    productId: number,
    quantity: number
  ) => {
    setError("");

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

    if (quantity > product.current_stock) {
      setError(
        `Stok ${product.name} hanya ${product.current_stock}.`
      );
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  const removeFromCart = (
    productId: number
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.product.id !== productId
      )
    );
  };

  const handleTransaction = async () => {
    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError(
        "Keranjang masih kosong."
      );
      return;
    }

    if (discount < 0) {
      setError(
        "Diskon tidak valid."
      );
      return;
    }

    if (discount > subtotal) {
      setError(
        "Diskon tidak boleh melebihi subtotal."
      );
      return;
    }

    if (paymentAmount < total) {
      setError(
        "Jumlah pembayaran masih kurang."
      );
      return;
    }

    try {
      setProcessing(true);

      const result =
        await createTransaction({
          items: cart.map((item) => ({
            product_id:
              item.product.id,
            quantity: item.quantity,
          })),
          discount,
          payment_method:
            paymentMethod,
          payment_amount:
            paymentAmount,
        });

      if (!result.success) {
        setError(
          result.message ||
            "Transaksi gagal."
        );
        return;
      }

      setSuccess(
        `Transaksi ${result.transaction.transaction_number} berhasil.`
      );

      setCart([]);
      setDiscount(0);
      setPaymentAmount(0);

      const refreshed =
        await getPOSProducts();

      if (refreshed.success) {
        setProducts(
          refreshed.products
        );
      }
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.detail ||
        "Transaksi gagal diproses.";

      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1>POS</h1>
        <p>Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="pos-page">
      <div className="page-header">
        <div>
          <h1>Point of Sale</h1>
          <p>
            Kelola transaksi penjualan
          </p>
        </div>
      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="pos-container">

        <section className="pos-products">

          <div className="pos-search">
            <input
              type="text"
              placeholder="Cari nama, SKU, atau barcode..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="pos-product-grid">

            {filteredProducts.length === 0 ? (
              <div>
                <p>
                  Produk tidak ditemukan.
                </p>
              </div>
            ) : (
              filteredProducts.map(
                (product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="pos-product-card"
                    onClick={() =>
                      addToCart(product)
                    }
                    disabled={
                      product.current_stock <=
                      0
                    }
                  >
                    <div>
                      <strong>
                        {product.name}
                      </strong>
                    </div>

                    <div>
                      {product.sku}
                    </div>

                    <div>
                      {formatRupiah(
                        product.selling_price
                      )}
                    </div>

                    <div>
                      Stok:{" "}
                      {product.current_stock}
                    </div>
                  </button>
                )
              )
            )}

          </div>
        </section>

        <section className="pos-cart">

          <div className="pos-cart-header">
            <h2>Keranjang</h2>

            <span>
              {cart.length} item
            </span>
          </div>

          <div className="pos-cart-items">

            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>
                  Keranjang masih kosong.
                </p>

                <span>
                  Pilih produk untuk memulai
                  transaksi.
                </span>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="pos-cart-item"
                >
                  <div>
                    <strong>
                      {item.product.name}
                    </strong>

                    <p>
                      {formatRupiah(
                        item.product
                          .selling_price
                      )}
                    </p>
                  </div>

                  <div className="cart-item-actions">

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity - 1
                        )
                      }
                    >
                      -
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(
                          item.product.id
                        )
                      }
                    >
                      Hapus
                    </button>

                  </div>

                  <strong>
                    {formatRupiah(
                      item.product
                        .selling_price *
                        item.quantity
                    )}
                  </strong>
                </div>
              ))
            )}

          </div>

          <div className="pos-summary">

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>
                {formatRupiah(
                  subtotal
                )}
              </strong>
            </div>

            <div className="summary-row">
              <span>Diskon</span>

              <input
                type="number"
                min="0"
                value={discount}
                onChange={(event) =>
                  setDiscount(
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </div>

            <div className="summary-row total-row">
              <span>Total</span>
              <strong>
                {formatRupiah(total)}
              </strong>
            </div>

            <div className="payment-section">

              <label>
                Metode Pembayaran
              </label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value
                  )
                }
              >
                <option value="CASH">
                  Cash
                </option>

                <option value="QRIS">
                  QRIS
                </option>

                <option value="DEBIT">
                  Debit
                </option>

                <option value="TRANSFER">
                  Transfer
                </option>
              </select>

              <label>
                Jumlah Pembayaran
              </label>

              <input
                type="number"
                min="0"
                value={paymentAmount}
                onChange={(event) =>
                  setPaymentAmount(
                    Number(
                      event.target.value
                    )
                  )
                }
              />

              <div className="change-row">
                <span>
                  Kembalian
                </span>

                <strong>
                  {formatRupiah(change)}
                </strong>
              </div>

            </div>

            <button
              type="button"
              className="login-button"
              onClick={
                handleTransaction
              }
              disabled={
                processing ||
                cart.length === 0
              }
            >
              {processing
                ? "Memproses..."
                : "Selesaikan Transaksi"}
            </button>

          </div>

        </section>

      </div>
    </div>
  );
}

export default POS;