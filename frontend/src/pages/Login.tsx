import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const result = await login({
        email,
        password,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      if (!result.access_token) {
        setError("Token login tidak ditemukan.");
        return;
      }

      localStorage.setItem(
        "access_token",
        result.access_token
      );

      if (result.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(result.user)
        );
      }

      navigate("/");
    } catch (error) {
      console.error(error);
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>RetailFlow</h1>
          <p>
            Retail Point of Sale & Inventory Management
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;