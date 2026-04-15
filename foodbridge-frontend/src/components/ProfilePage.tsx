import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import axios from "../api/axiosInstance";

interface ProfileData {
  id: number;
  username: string;
  email: string;
  role: string;
  date_joined: string;
}

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ProfilePageProps {
  onUsernameChange?: (newUsername: string) => void;
}

const roleColors: Record<string, string> = {
  donor: "bg-primary",
  ngo: "bg-success",
  volunteer: "bg-warning text-dark",
  admin: "bg-danger",
};

const ProfilePage = ({ onUsernameChange }: ProfilePageProps) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ── Fetch profile ──────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get<ProfileData>("profile/");
        setProfile(res.data);
        setForm({
          username: res.data.username,
          email: res.data.email,
          password: "",
          confirmPassword: "",
        });
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleCancel = () => {
    if (!profile) return;
    setForm({
      username: profile.username,
      email: profile.email,
      password: "",
      confirmPassword: "",
    });
    setEditing(false);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<FormState> = {
        username: form.username,
        email: form.email,
      };
      if (form.password) payload.password = form.password;

      const res = await axios.patch<ProfileData & { message: string }>(
        "profile/",
        payload
      );

      // Sync localStorage so Navbar stays fresh
      if (res.data.username !== profile?.username) {
        localStorage.setItem("username", res.data.username);
        onUsernameChange?.(res.data.username);
      }

      setProfile(res.data);
      setForm({ ...form, password: "", confirmPassword: "" });
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: Record<string, string> } }).response?.data
      ) {
        const data = (err as { response: { data: Record<string, string> } })
          .response.data;
        const firstMsg = Object.values(data)[0];
        setError(String(firstMsg));
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-5">
        <div 
          className="spinner-border text-primary" 
          role="status"
          aria-label="Loading profile data"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="alert alert-danger" role="alert">
        Could not load profile data.
      </div>
    );
  }

  const initials = profile.username.slice(0, 2).toUpperCase();

  return (
    <div className="card border-0 shadow-sm">
      {/* ── Card header ── */}
      <div
        className="card-header text-white py-4"
        style={{ background: "linear-gradient(135deg,#0d6efd,#0b5ed7)" }}
      >
        <div className="d-flex align-items-center gap-3">
          {/* Avatar */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4 text-white flex-shrink-0"
            style={{
              width: 64,
              height: 64,
              background: "rgba(255,255,255,0.25)",
              letterSpacing: 1,
            }}
            aria-label={`Avatar for ${profile.username}`}
          >
            {initials}
          </div>
          <div>
            <h5 className="mb-0 fw-bold">{profile.username}</h5>
            <small className="opacity-75">{profile.email}</small>
            <div className="mt-1">
              <span
                className={`badge ${roleColors[profile.role] ?? "bg-secondary"} px-2`}
                role="status"
              >
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="card-body p-4">
        {/* Alerts */}
        {error && (
          <div className="alert alert-danger d-flex gap-2 py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill mt-1 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success d-flex gap-2 py-2" role="status">
            <i className="bi bi-check-circle-fill mt-1 flex-shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        {/* ── Read-only view ── */}
        {!editing && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-sm-6">
                <label className="form-label text-muted small fw-semibold text-uppercase">
                  Username
                </label>
                <p className="fw-semibold mb-0" aria-label={`Username: ${profile.username}`}>
                  {profile.username}
                </p>
              </div>
              <div className="col-sm-6">
                <label className="form-label text-muted small fw-semibold text-uppercase">
                  Email
                </label>
                <p className="fw-semibold mb-0" aria-label={`Email: ${profile.email}`}>
                  {profile.email}
                </p>
              </div>
              <div className="col-sm-6">
                <label className="form-label text-muted small fw-semibold text-uppercase">
                  Role
                </label>
                <p className="mb-0">
                  <span
                    className={`badge ${roleColors[profile.role] ?? "bg-secondary"}`}
                    role="status"
                  >
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </p>
              </div>
              <div className="col-sm-6">
                <label className="form-label text-muted small fw-semibold text-uppercase">
                  Member Since
                </label>
                <p className="fw-semibold mb-0">
                  {new Date(profile.date_joined).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <button
              className="btn btn-primary px-4"
              onClick={() => setEditing(true)}
              aria-label="Edit profile"
              title="Edit profile information"
            >
              <i className="bi bi-pencil-fill me-2" aria-hidden="true" />
              Edit Profile
            </button>
          </>
        )}

        {/* ── Edit form ── */}
        {editing && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              {/* Username */}
              <div className="col-sm-6">
                <label className="form-label fw-semibold" htmlFor="p-username">
                  <i className="bi bi-person me-1 text-muted" aria-hidden="true" />
                  Username
                </label>
                <input
                  id="p-username"
                  type="text"
                  name="username"
                  className="form-control"
                  value={form.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  disabled={saving}
                  aria-label="Username"
                  aria-required="true"
                />
              </div>

              {/* Email */}
              <div className="col-sm-6">
                <label className="form-label fw-semibold" htmlFor="p-email">
                  <i className="bi bi-envelope me-1 text-muted" aria-hidden="true" />
                  Email
                </label>
                <input
                  id="p-email"
                  type="email"
                  name="email"
                  className="form-control"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  aria-label="Email address"
                  aria-required="true"
                />
              </div>

              {/* Divider */}
              <div className="col-12">
                <hr className="my-1" />
                <p className="text-muted small mb-0">
                  <i className="bi bi-shield-lock me-1" aria-hidden="true" />
                  Leave password fields blank to keep your current password.
                </p>
              </div>

              {/* New password */}
              <div className="col-sm-6">
                <label className="form-label fw-semibold" htmlFor="p-password">
                  New Password
                </label>
                <div className="input-group">
                  <input
                    id="p-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="form-control"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="New password (optional)"
                    minLength={6}
                    disabled={saving}
                    autoComplete="new-password"
                    aria-label="New password field"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <i 
                      className={`bi bi-eye${showPassword ? "-slash" : ""}`} 
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="col-sm-6">
                <label className="form-label fw-semibold" htmlFor="p-confirm">
                  Confirm Password
                </label>
                <input
                  id="p-confirm"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="form-control"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat new password"
                  disabled={saving || !form.password}
                  autoComplete="new-password"
                  aria-label="Confirm password field"
                />
              </div>

              {/* Actions */}
              <div className="col-12 d-flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={saving}
                  aria-label="Save profile changes"
                >
                  {saving ? (
                    <>
                      <span 
                        className="spinner-border spinner-border-sm me-2" 
                        role="status"
                        aria-hidden="true"
                      />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2" aria-hidden="true" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={handleCancel}
                  disabled={saving}
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;