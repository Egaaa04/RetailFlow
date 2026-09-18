import { useEffect, useState } from "react";

import {
  createCategory,
  getCategories,
  updateCategory,
} from "../services/categoryService";

import type { Category } from "../services/categoryService";


function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);


  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getCategories();

      if (result.success) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error(error);
      setError("Gagal mengambil data kategori.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadCategories();
  }, []);


  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setError("");

      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          {
            name,
            description,
          }
        );
      } else {
        await createCategory({
          name,
          description,
        });
      }

      setName("");
      setDescription("");
      setEditingCategory(null);
      setShowForm(false);

      await loadCategories();

    } catch (error) {
      console.error(error);
      setError(
        "Gagal menyimpan kategori."
      );
    }
  };


  const handleEdit = (category: Category) => {
    setEditingCategory(category);

    setName(category.name);
    setDescription(
      category.description ?? ""
    );

    setShowForm(true);
  };


  return (
    <div>

      <div className="page-header">

        <div>
          <h1>Kategori</h1>

          <p>
            Kelola kategori produk RetailFlow.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setName("");
            setDescription("");
            setShowForm(!showForm);
          }}
        >
          {showForm
            ? "Tutup"
            : "Tambah Kategori"}
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
            {editingCategory
              ? "Edit Kategori"
              : "Tambah Kategori"}
          </h2>


          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label>
                Nama Kategori
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Contoh: Makanan"
                required
              />

            </div>


            <div className="form-group">

              <label>
                Deskripsi
              </label>

              <input
                type="text"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Deskripsi kategori"
              />

            </div>


            <button type="submit">
              {editingCategory
                ? "Simpan Perubahan"
                : "Simpan Kategori"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingCategory(null);
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
            Memuat kategori...
          </p>

        ) : categories.length === 0 ? (
          <p>
            Belum ada kategori.
          </p>

        ) : (

          <table>

            <thead>

              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Deskripsi</th>
                <th>Aksi</th>
              </tr>

            </thead>


            <tbody>

              {categories.map(
                (category) => (

                  <tr key={category.id}>

                    <td>
                      {category.id}
                    </td>

                    <td>
                      {category.name}
                    </td>

                    <td>
                      {category.description || "-"}
                    </td>

                    <td>

                      <button
                        onClick={() =>
                          handleEdit(category)
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

export default Categories;