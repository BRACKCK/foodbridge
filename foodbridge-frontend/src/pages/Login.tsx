import { useState, type FormEvent, type ChangeEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

interface LoginFormData {
  username: string;
  password: string;
}

interface TokenResponse {
  access: string;
  refresh?: string;
  role: "donor" | "ngo" | "volunteer" | "admin";
}

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

  const roleRedirectMap: Record<string, string> = {
    donor: "/donor-dashboard",
    ngo: "/ngo-dashboard",
    volunteer: "/volunteer-dashboard",
    admin: "/admin-dashboard",
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post<TokenResponse>(`${API_URL}/token/`, formData);

      localStorage.setItem("token", response.data.access);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("username", formData.username);
      if (response.data.refresh) {
        localStorage.setItem("refreshToken", response.data.refresh);
      }

      const redirectPath = roleRedirectMap[response.data.role];
      navigate(redirectPath ?? "/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("Invalid username or password. Please try again.");
        } else if (err.response?.status === 429) {
          setError("Too many login attempts. Please try again later.");
        } else if (!err.response) {
          setError("Unable to connect to the server. Please check your connection.");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* auth-page: fills remaining height and centres content */
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div className="card border-0 shadow-lg">
          <div className="card-body p-4 p-md-5">

            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="fw-bold text-primary">FoodBridge</h2>
              <p className="text-secondary">Welcome back! Please sign in to continue.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  autoComplete="username"
                  autoFocus
                />
                <label htmlFor="username">
                  <i className="bi bi-person me-1" aria-hidden="true"></i>Username
                </label>
              </div>

              {/* Password */}
              <div className="mb-4">
                <div className="input-group">
                  <div className="form-floating flex-grow-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      autoComplete="current-password"
                    />
                    <label htmlFor="password">
                      <i className="bi bi-lock me-1" aria-hidden="true"></i>Password
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi bi-eye${showPassword ? "-slash" : ""}`} aria-hidden="true"></i>
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="mb-3 text-end">
                <Link to="/forgot-password" className="text-decoration-none small text-secondary">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in…
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Dev credentials */}
            {import.meta.env.DEV && (
              <div className="mt-3">
                <div className="alert alert-light border small p-2" role="alert">
                  <p className="mb-1 fw-semibold small text-uppercase text-secondary">Demo Credentials</p>
                  <p className="mb-0 small">
                    <strong>Donor:</strong> donor / pass123<br />
                    <strong>NGO:</strong> ngo_user / pass123
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-secondary mb-0">
                New to FoodBridge?{" "}
                <Link to="/register" className="text-decoration-none fw-semibold">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;