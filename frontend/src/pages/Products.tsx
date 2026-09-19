import { useEffect, useState } from "react";

import api from "../services/api";

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
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
        if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
        }
    };
    }, [imagePreview]);


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
    setImage(null);
    setImagePreview(null);
    setEditingProduct(null);
  };


 const handleSubmit = async (
    event: React.FormEvent
    ) => {
    event.preventDefault();

    try {
        setError("");

        const formData = new FormData();

        formData.append("sku", sku);
        formData.append("barcode", barcode);
        formData.append("name", name);
        formData.append("category_id", categoryId);
        formData.append("unit", unit);
        formData.append("purchase_price", purchasePrice);
        formData.append("selling_price", sellingPrice);
        formData.append("current_stock", stock);
        formData.append("minimum_stock", minimumStock);
        formData.append("expiration_date", expirationDate);
        formData.append("status", status);

        if (image) {
        formData.append("image", image);
        }

        if (editingProduct) {
        await updateProduct(
            editingProduct.id,
            formData
        );
        } else {
        await createProduct(formData);
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

    setImage(null);

    if (product.image_url) {
    setImagePreview(
        `${api.defaults.baseURL}${product.image_url}`
    );
    } else {
    setImagePreview(null);
    }

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
            
            <div className="form-group">
            <label>Gambar Produk</label>

            {imagePreview && (
                <div>
                <img
                    src={imagePreview}
                    alt="Preview produk"
                    className="product-image"
                />
                </div>
            )}

            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                const file =
                    event.target.files?.[0] ?? null;

                setImage(file);

                if (file) {
                    const previewUrl =
                    URL.createObjectURL(file);

                    setImagePreview(previewUrl);
                }
                }}
            />

            <small>
                Format: JPG, PNG, atau WEBP.
            </small>
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
                    <div className="product-cell">
                    {product.image_url ? (
                        <img
                        src={`${api.defaults.baseURL}${product.image_url}`}
                        alt={product.name}
                        className="product-image"
                        onError={(event) => {
                            event.currentTarget.style.display = "none";

                            const placeholder =
                            event.currentTarget.nextElementSibling as HTMLElement | null;

                            if (placeholder) {
                            placeholder.style.display = "flex";
                            }
                        }}
                        />
                    ) : null}

                    <div
                        className="product-placeholder"
                        style={{
                        display: product.image_url ? "none" : "flex",
                        }}
                    >
                        {product.name.charAt(0).toUpperCase()}
                    </div>

                    <span>{product.name}</span>
                    </div>
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