import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";


type Step = "form" | "otp";

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  role: "donor" | "ngo" | "volunteer" | "admin";
}


const Register = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

  /* Step: "form" → fill details → "otp" → verify code */
  const [step, setStep] = useState<Step>("form");

  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    role: "donor",
  });

  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  /* ── Helpers ────────────────────────────────────────────── */
  const startResendCountdown = () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ── Field change ───────────────────────────────────────── */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  /* ── OTP digit boxes ────────────────────────────────────── */
  const handleOtpDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    setOtp(next.join(""));

    // Auto-focus next box
    if (value && index < 5) {
      const nextEl = document.getElementById(`otp-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevEl = document.getElementById(`otp-${index - 1}`);
      prevEl?.focus();
    }
  };

  /* ── Step 1: Submit registration form → send OTP ────────── */
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSendingOtp(true);
    try {
      /*
        Backend endpoint (to be implemented):
          POST /api/send-otp/
          Body: { email }
          Response: { message: "OTP sent" }
      */
      await axios.post(`${API_URL}/send-otp/`, { email: formData.email });
      setStep("otp");
      startResendCountdown();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setError("This email is already registered. Please sign in.");
        } else if (err.response?.status === 400) {
          setError("Invalid email address.");
        } else if (!err.response) {
          /*
            If the backend OTP endpoint isn't ready yet, fall through to OTP
            screen anyway so the rest of the UI can be tested.
          */
          console.warn("OTP endpoint not reachable – advancing for demo purposes.");
          setStep("otp");
          startResendCountdown();
        } else {
          setError("Failed to send OTP. Please try again.");
        }
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  /* ── Step 2: Verify OTP → register user ─────────────────── */
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      /*
        Backend endpoint (to be implemented):
          POST /api/register/
          Body: { username, email, password, role, otp }
          Response: { message: "User registered successfully" }
      */
      await axios.post(`${API_URL}/register/`, { ...formData, otp });
      setSuccess("Account created! Redirecting you to login…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) {
          const detail = err.response.data?.otp || err.response.data?.username;
          if (detail) {
            setError(String(detail));
          } else if (err.response.data?.username) {
            setError("This username is already taken.");
          } else {
            setError("Invalid or expired OTP. Please try again.");
          }
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Resend OTP ─────────────────────────────────────────── */
  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setError(null);
    setIsSendingOtp(true);
    try {
      await axios.post(`${API_URL}/send-otp/`, { email: formData.email });
      startResendCountdown();
      setSuccess("A new code has been sent to your email.");
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      setError("Failed to resend OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div className="card border-0 shadow-lg">
          <div className="card-body p-4 p-md-5">

            {/* ── Progress indicator ── */}
            <div className="d-flex align-items-center gap-2 mb-4">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 13,
                  background: "#198754",
                  color: "#fff",
                }}
              >
                {step === "otp" ? <i className="bi bi-check-lg" /> : "1"}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: step === "otp" ? "#198754" : "#dee2e6",
                  transition: "background .3s",
                }}
              />
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 13,
                  background: step === "otp" ? "#198754" : "#dee2e6",
                  color: step === "otp" ? "#fff" : "#6c757d",
                  transition: "background .3s, color .3s",
                }}
              >
                2
              </div>
            </div>

            {/* ── Header ── */}
            <div className="text-center mb-4">
              <h2 className="fw-bold text-success mb-1">FoodBridge</h2>
              {step === "form" ? (
                <p className="text-secondary mb-0">Create your account to get started</p>
              ) : (
                <>
                  <p className="text-secondary mb-0">We sent a 6-digit code to</p>
                  <p className="fw-semibold text-dark mb-0">{formData.email}</p>
                </>
              )}
            </div>

            {/* ── Alerts ── */}
            {error && (
              <div className="alert alert-danger d-flex align-items-start gap-2 py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill mt-1 flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert">
                <i className="bi bi-check-circle-fill flex-shrink-0"></i>
                <span>{success}</span>
              </div>
            )}

            {/* ════════════════════════════════════════
                STEP 1 – Registration form
            ════════════════════════════════════════ */}
            {step === "form" && (
              <form onSubmit={handleFormSubmit}>
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
                    disabled={isSendingOtp}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                  <label htmlFor="username">Username</label>
                </div>

                {/* Email */}
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSendingOtp}
                    required
                    autoComplete="email"
                  />
                  <label htmlFor="email">
                    <i className="bi bi-envelope me-1"></i>Email address
                  </label>
                </div>

                {/* Password */}
                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSendingOtp}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <label htmlFor="password">Password</label>
                  <div className="form-text">Minimum 6 characters</div>
                </div>

                {/* Role */}
                <div className="mb-4">
                  <label
                    htmlFor="role"
                    className="form-label fw-semibold small text-uppercase text-secondary"
                  >
                    Account Type
                  </label>
                  <select
                    id="role"
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={isSendingOtp}
                    required
                  >
                    <option value="donor">🍽️ Donor (I want to give food)</option>
                    <option value="ngo">🏢 NGO (I distribute food)</option>
                    <option value="volunteer">🚚 Volunteer (I help transport)</option>
                    <option value="admin">⚙️ Administrator</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2 fw-semibold"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Sending verification code…
                    </>
                  ) : (
                    <>
                      Continue
                      <i className="bi bi-arrow-right ms-2"></i>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ════════════════════════════════════════
                STEP 2 – OTP verification
            ════════════════════════════════════════ */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit}>
                {/* 6-digit input boxes */}
                <div
                  className="d-flex justify-content-center gap-2 mb-4"
                  role="group"
                  aria-label="One-time password"
                >
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="form-control text-center fw-bold fs-4"
                      style={{
                        width: 48,
                        height: 56,
                        borderRadius: 10,
                        border: "2px solid",
                        borderColor: digit ? "#198754" : "#dee2e6",
                        transition: "border-color .15s",
                      }}
                      value={digit}
                      onChange={(e) => handleOtpDigit(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2 fw-semibold mb-3"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check me-2"></i>
                      Verify & Create Account
                    </>
                  )}
                </button>

                {/* Resend + back */}
                <div className="d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-link text-secondary p-0 small"
                    onClick={() => {
                      setStep("form");
                      setOtpDigits(["", "", "", "", "", ""]);
                      setOtp("");
                      setError(null);
                    }}
                  >
                    <i className="bi bi-arrow-left me-1"></i>Change email
                  </button>

                  <button
                    type="button"
                    className="btn btn-link p-0 small"
                    style={{ color: resendCountdown > 0 ? "#6c757d" : "#198754" }}
                    disabled={resendCountdown > 0 || isSendingOtp}
                    onClick={handleResend}
                  >
                    {isSendingOtp
                      ? "Sending…"
                      : resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {/* Footer link */}
            <div className="text-center mt-4">
              <p className="text-secondary mb-0">
                Already have an account?{" "}
                <Link to="/login" className="text-decoration-none fw-semibold text-success">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;