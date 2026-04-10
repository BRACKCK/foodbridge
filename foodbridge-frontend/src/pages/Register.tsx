import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// TypeScript interface for form state
interface RegisterFormData {
  username: string;
  password: string;
  role: "donor" | "ngo" | "volunteer" | "admin";
}

const Register = () => {
  const navigate = useNavigate();
  
  // State Management
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    password: "",
    role: "donor",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing again
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic password strength validation (Professional touch)
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // In production, use environment variables for API URLs
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
      await axios.post(`${API_URL}/register/`, formData);

      setSuccess("Registration successful! Redirecting you to login...");
      
      // Clear form
      setFormData({ username: "", password: "", role: "donor" });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.error("Registration error:", err);
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError("This username is already taken. Please choose another.");
      } else {
        setError("Unable to complete registration. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center min-vh-100 py-5">
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-5 col-xl-4">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4 p-md-5">
              
              {/* Header Section */}
              <div className="text-center mb-4">
                <h2 className="fw-bold text-success">FoodBridge</h2>
                <p className="text-secondary">Create your account to get started</p>
              </div>

              {/* Error / Success Alerts */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center py-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert alert-success d-flex align-items-center py-2" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Username Field */}
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
                  />
                  <label htmlFor="username">Username</label>
                </div>

                {/* Password Field */}
                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <label htmlFor="password">Password</label>
                  <div className="form-text">Minimum 6 characters</div>
                </div>

                {/* Role Selection */}
                <div className="mb-4">
                  <label htmlFor="role" className="form-label fw-semibold small text-uppercase text-secondary">
                    Account Type
                  </label>
                  <select
                    id="role"
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  >
                    <option value="donor">🍽️ Donor (I want to give food)</option>
                    <option value="ngo">🏢 NGO (I distribute food)</option>
                    <option value="volunteer">🚚 Volunteer (I help transport)</option>
                    <option value="admin">⚙️ Administrator</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-success w-100 py-2 fw-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Footer Link */}
              <div className="text-center mt-4">
                <p className="text-secondary mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="text-decoration-none fw-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;