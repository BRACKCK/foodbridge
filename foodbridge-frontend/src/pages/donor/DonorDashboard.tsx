import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ProfileCard from "../../components/ProfileCard";
import NotificationPanel from "../../components/NotificationPanel";
import DonorAnalytics from "../../components/DonorAnalytics";
import MoneyDonationForm from "../../components/MoneyDonationForm";
import MoneyDonationHistory from "../../components/MoneyDonationHistory";
import "./DonorDashboard.css";

interface Donation {
  id: number;
  owner: string;
  food: string;
  quantity: string;
  expiry: string;
  status: string;
  match_score: number;
  points: number;
  badge: string;
  co2_saved: number;
  meals_saved: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface DonationFormData {
  food: string;
  quantity: string;
  expiry: string;
  latitude: string;
  longitude: string;
}

interface ImpactStats {
  totalDonations: number;
  totalPoints: number;
  totalMeals: number;
  totalCO2: string;
  currentBadge: string;
  nextBadge: string;
  pointsToNextBadge: number;
}

// Tab type for switching between Food and Money sections
type ActiveTab = "food" | "money";

function DonorDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "";

  // Date helpers
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);
  const maxDateString = maxDate.toISOString().split("T")[0];

  // ─── State ────────────────────────────────────────────────
  const [formData, setFormData] = useState<DonationFormData>({
    food: "",
    quantity: "",
    expiry: "",
    latitude: "-1.2921",
    longitude: "36.8219",
  });

  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showMoneyForm, setShowMoneyForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<DonationFormData>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>("food");

  // ─── Full-width layout fix ────────────────────────────────
  useEffect(() => {
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.width = "100%";
      rootElement.style.maxWidth = "100%";
      rootElement.style.margin = "0";
      rootElement.style.padding = "0";
    }
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.width = "100%";
    document.body.style.overflowX = "hidden";
  }, []);

  // ─── Impact stats ─────────────────────────────────────────
  const stats = useMemo<ImpactStats>(() => {
    const totalPoints = donations.reduce((sum, d) => sum + d.points, 0);
    const totalMeals = donations.reduce((sum, d) => sum + d.meals_saved, 0);
    const totalCO2 = donations.reduce((sum, d) => sum + d.co2_saved, 0).toFixed(2);
    const currentBadge = donations.length > 0 ? donations[0].badge : "Starter";

    const badgeThresholds: Record<string, number> = {
      Starter: 0,
      Bronze: 100,
      Silver: 250,
      Gold: 500,
      Platinum: 1000,
    };

    const badges = Object.entries(badgeThresholds);
    const nextBadgeEntry = badges.find(([, threshold]) => threshold > totalPoints);
    const nextBadge = nextBadgeEntry ? nextBadgeEntry[0] : "Platinum";
    const pointsToNextBadge = nextBadgeEntry ? nextBadgeEntry[1] - totalPoints : 0;

    return {
      totalDonations: donations.length,
      totalPoints,
      totalMeals,
      totalCO2,
      currentBadge,
      nextBadge,
      pointsToNextBadge,
    };
  }, [donations]);

  // ─── Fetch food donations ─────────────────────────────────
  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<Donation[]>("donations/");
      setDonations(res.data);
    } catch (err) {
      console.error("Failed to load donations:", err);
      setError("Unable to load donations. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Filter / sort food donations ────────────────────────
  const applyFilters = useCallback(() => {
    let filtered = [...donations];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (d) => d.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((d) =>
        d.food.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredDonations(filtered);
  }, [donations, searchTerm, statusFilter]);

  // ─── Auth guard + initial load ────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (!token || savedRole !== "donor") {
      navigate("/login");
      return;
    }
    fetchDonations();
  }, [navigate, fetchDonations]);

  // ─── CSS custom properties for progress bars ─────────────
  useEffect(() => {
    const progressBars = document.querySelectorAll(
      ".progress-bar[data-progress-width]"
    );
    progressBars.forEach((bar) => {
      const el = bar as HTMLElement;
      const width = el.dataset.progressWidth;
      if (width) el.style.setProperty("--progress-width", width);
    });
  }, [filteredDonations, stats]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ─── Form validation ──────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Partial<DonationFormData> = {};

    if (!formData.food.trim()) errors.food = "Food item is required";
    if (!formData.quantity.trim()) errors.quantity = "Quantity is required";

    if (!formData.expiry) {
      errors.expiry = "Expiry date is required";
    } else if (new Date(formData.expiry) <= new Date()) {
      errors.expiry = "Expiry date must be in the future";
    }

    const lat = parseFloat(formData.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90)
      errors.latitude = "Valid latitude required (-90 to 90)";

    const lng = parseFloat(formData.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180)
      errors.longitude = "Valid longitude required (-180 to 180)";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Field change handler ─────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name as keyof DonationFormData]) {
      setFormErrors({ ...formErrors, [name]: undefined });
    }
  };

  // ─── Submit food donation ─────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post<Donation>("donations/", {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });

      setDonations([response.data, ...donations]);
      setFormData({
        food: "",
        quantity: "",
        expiry: "",
        latitude: "-1.2921",
        longitude: "36.8219",
      });
      setFormErrors({});
      setShowDonationForm(false);
      setSuccessMessage(
        "Donation posted successfully! Thank you for your contribution."
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Failed to save donation:", err);
      setError("Failed to post donation. Please check your inputs and try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleStatusFilterChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setStatusFilter(e.target.value);

  const handleRefresh = () => fetchDonations();

  const getStatusBadgeClass = (status: string): string => {
    const map: Record<string, string> = {
      Accepted: "bg-success",
      Delivered: "bg-primary",
      Collected: "bg-info",
      Pending: "bg-warning",
      Cancelled: "bg-danger",
    };
    return map[status] || "bg-secondary";
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getExpiryClass = (expiry: string): string => {
    const daysLeft = Math.ceil(
      (new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) return "expired";
    if (daysLeft <= 1) return "urgent";
    if (daysLeft <= 3) return "warning";
    return "";
  };

  const getProgressWidth = (): string => {
    const denominator = stats.totalPoints + stats.pointsToNextBadge || 1;
    return `${Math.min((stats.totalPoints / denominator) * 100, 100)}%`;
  };

  const getMinDateTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="donor-dashboard">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="dashboard-title">
                <i className="bi bi-gift-fill me-2"></i>
                Donor Dashboard
              </h1>
              <p className="dashboard-subtitle">
                Share surplus food, donate money, earn rewards, and track your impact
              </p>
            </div>
            <div className="col-md-4">
              <div className="dashboard-header-actions">
                <button
                  className="btn btn-light me-2"
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh donations"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
                <ProfileCard username={username} role={role} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">

        {/* ── Notifications ── */}
        <NotificationPanel />

        {/* ── Success alert ── */}
        {successMessage && (
          <div
            className="alert alert-success alert-dismissible fade show shadow-sm"
            role="alert"
          >
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccessMessage(null)}
              aria-label="Close"
            />
          </div>
        )}

        {/* ── Error alert ── */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show shadow-sm"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
              aria-label="Close"
            />
          </div>
        )}

        {/* ── Impact Stats Cards ── */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-box-seam"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalDonations}</h3>
                <p className="stat-label">Food Donations</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-star-fill"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalPoints}</h3>
                <p className="stat-label">Points Earned</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-egg-fried"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalMeals}</h3>
                <p className="stat-label">Meals Provided</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-tree-fill"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalCO2} kg</h3>
                <p className="stat-label">CO₂ Saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Badge Progress Card ── */}
        <div className="badge-progress-card mb-4">
          <div className="row align-items-center">
            <div className="col-md-4">
              <div className="current-badge">
                <div className="badge-icon">
                  <i className="bi bi-award-fill"></i>
                </div>
                <div className="badge-info">
                  <span className="badge-label">Current Badge</span>
                  <span className="badge-name">{stats.currentBadge}</span>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="badge-progress">
                <div className="progress-label">
                  <span>Progress to {stats.nextBadge}</span>
                  <span>{stats.pointsToNextBadge} points needed</span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-warning"
                    data-progress-width={getProgressWidth()}
                    role="progressbar"
                    aria-label="Progress to next badge"
                    aria-valuenow={stats.totalPoints}
                    aria-valuemin={0}
                    aria-valuemax={stats.totalPoints + stats.pointsToNextBadge}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            Tab Navigation — Food Donations | Money Donations
        ══════════════════════════════════════════════════ */}
        <ul className="nav nav-tabs mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "food" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("food");
                setShowMoneyForm(false);
              }}
              role="tab"
              aria-selected={activeTab === "food"}
            >
              <i className="bi bi-box-seam me-2"></i>
              Food Donations
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "money" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("money");
                setShowDonationForm(false);
              }}
              role="tab"
              aria-selected={activeTab === "money"}
            >
              <i className="bi bi-paypal me-2"></i>
              Money Donations
            </button>
          </li>
        </ul>

        {/* ══════════════════════════════════════════════════
            TAB 1 — Food Donations
        ══════════════════════════════════════════════════ */}
        {activeTab === "food" && (
          <>
            {/* Quick Action */}
            <div className="quick-actions mb-4">
              <button
                className="btn btn-success btn-lg"
                onClick={() => setShowDonationForm(!showDonationForm)}
              >
                <i
                  className={`bi bi-${showDonationForm ? "x-lg" : "plus-lg"} me-2`}
                />
                {showDonationForm ? "Cancel" : "Post New Food Donation"}
              </button>
            </div>

            {/* Food Donation Form */}
            {showDonationForm && (
              <div className="donation-form-card mb-4">
                <div className="card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-plus-circle me-2"></i>
                    Post a Food Donation
                  </h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">

                      <div className="col-md-6">
                        <label className="form-label" htmlFor="food">
                          <i className="bi bi-tag me-1"></i>Food Item
                        </label>
                        <input
                          id="food"
                          type="text"
                          name="food"
                          className={`form-control ${formErrors.food ? "is-invalid" : ""}`}
                          placeholder="e.g., Fresh Vegetables, Bread, Rice"
                          value={formData.food}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.food && (
                          <div className="invalid-feedback">{formErrors.food}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" htmlFor="quantity">
                          <i className="bi bi-box me-1"></i>Quantity
                        </label>
                        <input
                          id="quantity"
                          type="text"
                          name="quantity"
                          className={`form-control ${formErrors.quantity ? "is-invalid" : ""}`}
                          placeholder="e.g., 5 kg, 20 portions, 10 loaves"
                          value={formData.quantity}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.quantity && (
                          <div className="invalid-feedback">{formErrors.quantity}</div>
                        )}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" htmlFor="expiry">
                          <i className="bi bi-calendar me-1"></i>Expiry Date & Time
                        </label>
                        <div className="expiry-input-wrapper">
                          <input
                            id="expiry"
                            type="datetime-local"
                            name="expiry"
                            className={`form-control expiry-date-input ${
                              formErrors.expiry ? "is-invalid" : ""
                            }`}
                            value={formData.expiry}
                            onChange={handleChange}
                            min={getMinDateTime()}
                            max={maxDateString + "T23:59"}
                            required
                            onClick={(e) =>
                              (e.target as HTMLInputElement).showPicker?.()
                            }
                          />
                          <i className="bi bi-calendar3 calendar-icon"></i>
                        </div>
                        {formErrors.expiry && (
                          <div className="invalid-feedback">{formErrors.expiry}</div>
                        )}
                        <small className="text-muted expiry-hint">
                          <i className="bi bi-info-circle me-1"></i>
                          Click the calendar icon to select date and time
                        </small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" htmlFor="latitude">
                          <i className="bi bi-geo-alt me-1"></i>Latitude
                        </label>
                        <input
                          id="latitude"
                          type="number"
                          step="any"
                          name="latitude"
                          className={`form-control ${formErrors.latitude ? "is-invalid" : ""}`}
                          placeholder="e.g., -1.2921"
                          value={formData.latitude}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.latitude && (
                          <div className="invalid-feedback">{formErrors.latitude}</div>
                        )}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" htmlFor="longitude">
                          <i className="bi bi-geo-alt me-1"></i>Longitude
                        </label>
                        <input
                          id="longitude"
                          type="number"
                          step="any"
                          name="longitude"
                          className={`form-control ${formErrors.longitude ? "is-invalid" : ""}`}
                          placeholder="e.g., 36.8219"
                          value={formData.longitude}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.longitude && (
                          <div className="invalid-feedback">{formErrors.longitude}</div>
                        )}
                      </div>

                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                              />
                              Posting...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-send me-2"></i>Post Donation
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Food Donations Table */}
            <div className="donations-card">
              <div className="donations-card-header">
                <div className="row g-3 align-items-center">
                  <div className="col-md-6">
                    <h4 className="donations-title">
                      <i className="bi bi-list-ul me-2 text-primary"></i>
                      Your Food Donations
                      <span className="badge bg-primary ms-3 rounded-pill">
                        {filteredDonations.length}
                      </span>
                    </h4>
                  </div>
                  <div className="col-md-6">
                    <div className="donations-filters">
                      <div className="search-wrapper">
                        <i className="bi bi-search search-icon"></i>
                        <input
                          type="text"
                          className="form-control search-input"
                          placeholder="Search food items..."
                          value={searchTerm}
                          onChange={handleSearchChange}
                          aria-label="Search donations"
                        />
                      </div>
                      <select
                        className="form-select filter-select"
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        aria-label="Filter by status"
                        title="Filter donations by status"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="collected">Collected</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="donations-card-body">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-secondary">Loading your donations...</p>
                  </div>
                ) : filteredDonations.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-inbox empty-icon"></i>
                    <h5 className="mt-3">No donations yet</h5>
                    <p className="text-secondary">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Click 'Post New Food Donation' to get started"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table donations-table">
                        <thead>
                          <tr>
                            <th className="ps-4">Food Item</th>
                            <th>Quantity</th>
                            <th>Expiry</th>
                            <th>Status</th>
                            <th>Match Score</th>
                            <th>Impact</th>
                            <th>Points</th>
                            <th>Badge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDonations.map((donation) => (
                            <tr
                              key={donation.id}
                              className={getExpiryClass(donation.expiry)}
                            >
                              <td className="ps-4" data-label="Food Item">
                                <div className="food-info">
                                  <div className="food-icon">
                                    <i className="bi bi-basket"></i>
                                  </div>
                                  <span className="food-name">{donation.food}</span>
                                </div>
                              </td>
                              <td data-label="Quantity">
                                <span className="fw-medium">{donation.quantity}</span>
                              </td>
                              <td data-label="Expiry">
                                <span
                                  className={`expiry-badge ${getExpiryClass(donation.expiry)}`}
                                >
                                  <i className="bi bi-clock me-1"></i>
                                  {formatDate(donation.expiry)}
                                </span>
                              </td>
                              <td data-label="Status">
                                <span
                                  className={`badge ${getStatusBadgeClass(donation.status)}`}
                                >
                                  {donation.status}
                                </span>
                              </td>
                              <td data-label="Match Score">
                                <div className="match-score">
                                  <div className="progress match-progress">
                                    <div
                                      className="progress-bar bg-success"
                                      data-progress-width={`${donation.match_score}%`}
                                      role="progressbar"
                                      aria-label={`Match score ${donation.match_score} percent`}
                                    />
                                  </div>
                                  <span className="match-score-value">
                                    {donation.match_score}%
                                  </span>
                                </div>
                              </td>
                              <td data-label="Impact">
                                <div className="impact-badges">
                                  <span className="impact-badge" title="Meals Saved">
                                    <i className="bi bi-egg-fried text-warning"></i>
                                    {donation.meals_saved}
                                  </span>
                                  <span className="impact-badge" title="CO₂ Saved">
                                    <i className="bi bi-tree text-success"></i>
                                    {donation.co2_saved}kg
                                  </span>
                                </div>
                              </td>
                              <td data-label="Points">
                                <span className="points-badge">
                                  <i className="bi bi-star-fill text-warning me-1"></i>
                                  {donation.points}
                                </span>
                              </td>
                              <td data-label="Badge">
                                <span className="badge bg-secondary">
                                  {donation.badge}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Analytics */}
                    <div className="analytics-section p-3">
                      <DonorAnalytics donations={donations} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 2 — Money Donations
        ══════════════════════════════════════════════════ */}
        {activeTab === "money" && (
          <div className="row g-4">

            {/* Left column — form toggle + form */}
            <div className="col-lg-6">

              {/* Toggle button */}
              <div className="mb-4">
                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={() => setShowMoneyForm(!showMoneyForm)}
                >
                  <i
                    className={`bi bi-${showMoneyForm ? "x-lg" : "paypal"} me-2`}
                  />
                  {showMoneyForm ? "Cancel" : "Donate Money via PayPal"}
                </button>
              </div>

              {/* PayPal form */}
              {showMoneyForm && (
                <MoneyDonationForm
                  onSuccess={() => {
                    setShowMoneyForm(false);
                    setSuccessMessage(
                      "Redirecting to PayPal to complete your donation..."
                    );
                  }}
                />
              )}

              {/* Info card shown when form is hidden */}
              {!showMoneyForm && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4 text-center">
                    <i className="bi bi-paypal display-4 text-primary mb-3"></i>
                    <h5 className="fw-bold mb-2">Support an NGO Financially</h5>
                    <p className="text-muted mb-3">
                      In addition to food donations, you can send money directly
                      to an NGO of your choice via PayPal. 100% of your donation
                      goes to supporting their operations.
                    </p>
                    <div className="row g-2 text-start">
                      <div className="col-12">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <i className="bi bi-shield-check text-success fs-5"></i>
                          Secured by PayPal — your card details are never stored
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <i className="bi bi-building text-primary fs-5"></i>
                          Choose which NGO receives your donation
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <i className="bi bi-bell text-warning fs-5"></i>
                          Both you and the NGO get notified instantly
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column — history */}
            <div className="col-lg-6">
              <MoneyDonationHistory />
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default DonorDashboard;