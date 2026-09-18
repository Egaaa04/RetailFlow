import { useEffect, useState } from "react";

import {
  createUser,
  getUsers,
  updateUser,
  updateUserStatus,
  resetUserPassword,
} from "../services/userService";

import type { User } from "../services/userService";

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("cashier");

  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const handleEditUser = async (
  event: React.FormEvent
) => {
  event.preventDefault();

  if (!editingUser) {
    return;
  }

  try {
    await updateUser(
      editingUser.id,
      {
        name: editName,
        email: editEmail,
        role: editRole,
      }
    );

    setEditingUser(null);

    await loadUsers();
  } catch (error) {
    console.error(error);
    setError("Gagal memperbarui pengguna.");
  }
};

  const handleToggleStatus = async (
  userId: number
) => {
  const confirmed = window.confirm(
    "Apakah status pengguna ingin diubah?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await updateUserStatus(userId);

    await loadUsers();
  } catch (error) {
    console.error(error);
    setError(
      "Gagal mengubah status pengguna."
    );
  }
};

const handleResetPassword = async (
  event: React.FormEvent
) => {
  event.preventDefault();

  if (!resetUser) {
    return;
  }

  try {
    await resetUserPassword(
      resetUser.id,
      newPassword
    );

    setResetUser(null);
    setNewPassword("");

    alert("Password berhasil direset.");
  } catch (error) {
    console.error(error);
    setError(
      "Gagal mereset password."
    );
  }
};

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getUsers();

      if (result.success) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error(error);
      setError("Gagal mengambil data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setError("");

      await createUser({
        name,
        email,
        password,
        role,
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("cashier");

      setShowForm(false);

      await loadUsers();
    } catch (error) {
      console.error(error);
      setError("Gagal membuat pengguna.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pengguna</h1>
          <p>Kelola pengguna dan role RetailFlow.</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Tutup" : "Tambah Pengguna"}
        </button>
      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <h2>Tambah Pengguna</h2>

          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Nama</label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Nama pengguna"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Email pengguna"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Password"
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
              >
                <option value="admin">
                  Admin
                </option>

                <option value="cashier">
                  Cashier
                </option>
              </select>
            </div>

            <button type="submit">
              Simpan Pengguna
            </button>
          </form>
        </div>
      )}
      {editingUser && (
        <div className="form-card">
          <h2>Edit Pengguna</h2>

          <form onSubmit={handleEditUser}>
            <div className="form-group">
              <label>Nama</label>

              <input
                type="text"
                value={editName}
                onChange={(event) =>
                  setEditName(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                value={editEmail}
                onChange={(event) =>
                  setEditEmail(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>

              <select
                value={editRole}
                onChange={(event) =>
                  setEditRole(event.target.value)
                }
              >
                <option value="admin">
                  Admin
                </option>

                <option value="cashier">
                  Cashier
                </option>
              </select>
            </div>

            <button type="submit">
              Simpan Perubahan
            </button>

            <button
              type="button"
              onClick={() =>
                setEditingUser(null)
              }
            >
              Batal
            </button>
          </form>
        </div>
      )}
      {resetUser && (
        <div className="form-card">
          <h2>Reset Password</h2>

          <p>
            User: <strong>{resetUser.name}</strong>
          </p>

          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Password Baru</label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                minLength={8}
                required
              />
            </div>

            <button type="submit">
              Reset Password
            </button>

            <button
              type="button"
              onClick={() => {
                setResetUser(null);
                setNewPassword("");
              }}
            >
              Batal
            </button>
          </form>
        </div>
      )}
      <div className="table-card">
        {loading ? (
          <p>Memuat data pengguna...</p>
        ) : users.length === 0 ? (
          <p>Belum ada pengguna.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>

                  <td>{user.name}</td>

                  <td>{user.email}</td>

                  <td>{user.role}</td>

                  <td>
                    {user.is_active
                      ? "Aktif"
                      : "Tidak Aktif"}
                  </td>

                  <td>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setEditName(user.name);
                        setEditEmail(user.email);
                        setEditRole(user.role);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleToggleStatus(user.id)
                      }
                    >
                      {user.is_active
                        ? "Nonaktifkan"
                        : "Aktifkan"}
                    </button>

                    <button
                      onClick={() => {
                        setResetUser(user);
                        setNewPassword("");
                      }}
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Users;