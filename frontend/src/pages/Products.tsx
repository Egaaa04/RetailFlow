import { useEffect, useState } from "react";

import {
  createProduct,
  getProducts,
  updateProduct,
} from "../services/productService";

import type { Product } from "../services/productService";

import {
  getCategories,
} from "../services/categoryService";

import type {
  Category,
} from "../services/categoryService";


function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [minimumStock, setMinimumStock] = useState("0");
  const [expirationDate, setExpirationDate] = useState("");
  const [status, setStatus] = useState("active");


  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        productResult,
        categoryResult,
      ] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      if (productResult.success) {
        setProducts(productResult.products);
      }

      if (categoryResult.success) {
        setCategories(
          categoryResult.categories
        );
      }

    } catch (error) {
      console.error(error);
      setError(
        "Gagal mengambil data produk."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  const resetForm = () => {
    setSku("");
    setBarcode("");
    setName("");
    setCategoryId("");
    setUnit("pcs");
    setPurchasePrice("");
    setSellingPrice("");
    setStock("0");
    setMinimumStock("0");
    setExpirationDate("");
    setStatus("active");
    setEditingProduct(null);
  };


  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setError("");

      const data = {
        sku,
        barcode: barcode || undefined,
        name,
        category_id: Number(categoryId),
        unit,
        purchase_price: Number(
          purchasePrice
        ),
        selling_price: Number(
          sellingPrice
        ),
        current_stock: Number(stock),
        minimum_stock: Number(
          minimumStock
        ),
        expiration_date:
          expirationDate || undefined,
        status,
      };

      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          data
        );
      } else {
        await createProduct(data);
      }

      resetForm();
      setShowForm(false);

      await loadData();

    } catch (error) {
      console.error(error);

      setError(
        "Gagal menyimpan produk."
      );
    }
  };


  const handleEdit = (
    product: Product
  ) => {
    setEditingProduct(product);

    setSku(product.sku);
    setBarcode(product.barcode ?? "");
    setName(product.name);
    setCategoryId(
      String(product.category_id)
    );
    setUnit(product.unit);
    setPurchasePrice(
      String(product.purchase_price)
    );
    setSellingPrice(
      String(product.selling_price)
    );
    setStock(
      String(product.current_stock)
    );
    setMinimumStock(
      String(product.minimum_stock)
    );
    setExpirationDate(
      product.expiration_date ?? ""
    );
    setStatus(product.status);

    setShowForm(true);
  };


  const getCategoryName = (
    categoryId: number
  ) => {
    const category = categories.find(
      (item) =>
        item.id === categoryId
    );

    return category
      ? category.name
      : "-";
  };


  return (
    <div>

      <div className="page-header">

        <div>
          <h1>Produk</h1>

          <p>
            Kelola produk dan informasi stok
            RetailFlow.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            }

            setShowForm(!showForm);
          }}
        >
          {showForm
            ? "Tutup"
            : "Tambah Produk"}
        </button>

      </div>


      {error && (
        <div className="login-error">
          {error}
        </div>
      )}


      {showForm && (
        <div className="form-card">

          <h2>
            {editingProduct
              ? "Edit Produk"
              : "Tambah Produk"}
          </h2>


          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>SKU</label>

              <input
                type="text"
                value={sku}
                onChange={(event) =>
                  setSku(event.target.value)
                }
                required
              />
            </div>


            <div className="form-group">
              <label>Barcode</label>

              <input
                type="text"
                value={barcode}
                onChange={(event) =>
                  setBarcode(
                    event.target.value
                  )
                }
              />
            </div>


            <div className="form-group">
              <label>Nama Produk</label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </div>


            <div className="form-group">
              <label>Kategori</label>

              <select
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Pilih kategori
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}

              </select>
            </div>


            <div className="form-group">
              <label>Satuan</label>

              <input
                type="text"
                value={unit}
                onChange={(event) =>
                  setUnit(event.target.value)
                }
                placeholder="pcs, botol, kg, dll."
                required
              />
            </div>


            <div className="form-group">
              <label>Harga Beli</label>

              <input
                type="number"
                min="0"
                value={purchasePrice}
                onChange={(event) =>
                  setPurchasePrice(
                    event.target.value
                  )
                }
                required
              />
            </div>


            <div className="form-group">
              <label>Harga Jual</label>

              <input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(event) =>
                  setSellingPrice(
                    event.target.value
                  )
                }
                required
              />
            </div>


            {!editingProduct && (
              <div className="form-group">
                <label>Stok Awal</label>

                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(event) =>
                    setStock(
                      event.target.value
                    )
                  }
                />
              </div>
            )}


            <div className="form-group">
              <label>
                Minimum Stok
              </label>

              <input
                type="number"
                min="0"
                value={minimumStock}
                onChange={(event) =>
                  setMinimumStock(
                    event.target.value
                  )
                }
              />
            </div>


            <div className="form-group">
              <label>
                Tanggal Kedaluwarsa
              </label>

              <input
                type="date"
                value={expirationDate}
                onChange={(event) =>
                  setExpirationDate(
                    event.target.value
                  )
                }
              />
            </div>


            <div className="form-group">
              <label>Status</label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
              >
                <option value="active">
                  Aktif
                </option>

                <option value="inactive">
                  Tidak Aktif
                </option>
              </select>
            </div>


            <button type="submit">
              {editingProduct
                ? "Simpan Perubahan"
                : "Simpan Produk"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Batal
            </button>

          </form>

        </div>
      )}


      <div className="table-card">

        {loading ? (
          <p>
            Memuat produk...
          </p>

        ) : products.length === 0 ? (
          <p>
            Belum ada produk.
          </p>

        ) : (

          <table>

            <thead>

              <tr>
                <th>SKU</th>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Satuan</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>

            </thead>


            <tbody>

              {products.map(
                (product) => (

                  <tr key={product.id}>

                    <td>
                      {product.sku}
                    </td>

                    <td>
                      {product.name}
                    </td>

                    <td>
                      {getCategoryName(
                        product.category_id
                      )}
                    </td>

                    <td>
                      {product.unit}
                    </td>

                    <td>
                      Rp{" "}
                      {product.purchase_price.toLocaleString(
                        "id-ID"
                      )}
                    </td>

                    <td>
                      Rp{" "}
                      {product.selling_price.toLocaleString(
                        "id-ID"
                      )}
                    </td>

                    <td>
                      {product.current_stock}

                      {product.current_stock <=
                        product.minimum_stock && (
                        <span>
                          {" "}
                          Rendah
                        </span>
                      )}
                    </td>

                    <td>
                      {product.status ===
                      "active"
                        ? "Aktif"
                        : "Tidak Aktif"}
                    </td>

                    <td>

                      <button
                        onClick={() =>
                          handleEdit(
                            product
                          )
                        }
                      >
                        Edit
                      </button>

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

export default Products;