import { useEffect, useState } from "react";
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
} from "../services/supplierService";

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchSuppliers = async () => {
    try {
      const result = await getSuppliers();

      if (result.success) {
        setSuppliers(result.suppliers);
      }
    } catch (error) {
      console.error(error);
      setError("Gagal mengambil data supplier.");
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Nama supplier wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const data = {
        name,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
      };

      if (editingId !== null) {
        const result = await updateSupplier(
          editingId,
          data
        );

        if (!result.success) {
          setError(result.message);
          return;
        }

        setMessage("Supplier berhasil diperbarui.");
      } else {
        const result = await createSupplier(data);

        if (!result.success) {
          setError(result.message);
          return;
        }

        setMessage("Supplier berhasil ditambahkan.");
      }

      resetForm();
      await fetchSuppliers();

    } catch (error: any) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
        "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setName(supplier.name);
    setPhone(supplier.phone || "");
    setEmail(supplier.email || "");
    setAddress(supplier.address || "");
    setError("");
    setMessage("");
  };


  return (
    <div>
      <h1>Supplier</h1>

      <p>
        Kelola data supplier yang menyediakan barang.
      </p>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {message && (
        <p>{message}</p>
      )}

      <div className="form-card">

        <h2>
          {editingId !== null
            ? "Edit Supplier"
            : "Tambah Supplier"}
        </h2>

        <div className="form-group">
          <label>Nama Supplier</label>

          <input
            type="text"
            value={name}
            placeholder="Contoh: PT Sumber Makmur"
            onChange={(event) =>
              setName(event.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>No. Telepon</label>

          <input
            type="text"
            value={phone}
            placeholder="081234567890"
            onChange={(event) =>
              setPhone(event.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>Email</label>

          <input
            type="email"
            value={email}
            placeholder="supplier@example.com"
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>Alamat</label>

          <textarea
            value={address}
            placeholder="Alamat supplier"
            onChange={(event) =>
              setAddress(event.target.value)
            }
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Menyimpan..."
            : editingId !== null
            ? "Simpan Perubahan"
            : "Tambah Supplier"}
        </button>

        {editingId !== null && (
          <button
            onClick={resetForm}
            type="button"
          >
            Batal
          </button>
        )}

      </div>

      <div className="table-card">

        <h2>Daftar Supplier</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama</th>
              <th>Telepon</th>
              <th>Email</th>
              <th>Alamat</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.id}</td>

                <td>{supplier.name}</td>

                <td>
                  {supplier.phone || "-"}
                </td>

                <td>
                  {supplier.email || "-"}
                </td>

                <td>
                  {supplier.address || "-"}
                </td>

                <td>
                  {supplier.is_active
                    ? "Aktif"
                    : "Nonaktif"}
                </td>

                <td>
                  <button
                    onClick={() =>
                      handleEdit(supplier)
                    }
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {suppliers.length === 0 && (
              <tr>
                <td colSpan={7}>
                  Belum ada supplier.
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}

export default Suppliers;