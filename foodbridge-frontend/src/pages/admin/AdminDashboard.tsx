import { useEffect, useState, useCallback, useMemo, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ProfileCard from "../../components/ProfileCard";
import NotificationPanel from "../../components/NotificationPanel";
import "./AdminDashboard.css";

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

interface Notification {
  id: number;
  role: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface DashboardStats {
  totalDonations: number;
  pending: number;
  accepted: number;
  collected: number;
  delivered: number;
  totalMeals: number;
  totalCO2: string;
  totalPoints: number;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "Admin";
  const role = localStorage.getItem("role") || "";

  const [donations, setDonations] = useState<Donation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"donations" | "notifications" | "analytics">("donations");

  // Remove root element width constraints
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.width = '100%';
      rootElement.style.maxWidth = '100%';
      rootElement.style.margin = '0';
      rootElement.style.padding = '0';
    }
    
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';
  }, []);

  const stats = useMemo<DashboardStats>(() => {
    return {
      totalDonations: donations.length,
      pending: donations.filter((d) => d.status === "Pending").length,
      accepted: donations.filter((d) => d.status === "Accepted").length,
      collected: donations.filter((d) => d.status === "Collected").length,
      delivered: donations.filter((d) => d.status === "Delivered").length,
      totalMeals: donations.reduce((sum, d) => sum + d.meals_saved, 0),
      totalCO2: donations.reduce((sum, d) => sum + d.co2_saved, 0).toFixed(2),
      totalPoints: donations.reduce((sum, d) => sum + d.points, 0),
    };
  }, [donations]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [donationRes, notificationRes] = await Promise.all([
        axios.get<Donation[]>("donations/"),
        axios.get<Notification[]>("donations/notifications/"),
      ]);

      setDonations(donationRes.data);
      setNotifications(notificationRes.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError("Failed to load admin dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...donations];

    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.food.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by newest first
    filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredDonations(filtered);
  }, [donations, searchTerm, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");

    if (!token || savedRole !== "admin") {
      navigate("/login");
      return;
    }

    fetchData();
  }, [navigate, fetchData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    const progressBars = document.querySelectorAll('.progress-bar[data-progress-width]');
    progressBars.forEach((bar) => {
      const element = bar as HTMLElement;
      const width = element.dataset.progressWidth;
      if (width) {
        element.style.setProperty('--progress-width', width);
      }
    });
  }, [filteredDonations]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await axios.patch<Donation>(`donations/${id}/status/`, {
        status: newStatus,
      });

      setDonations((prev) =>
        prev.map((donation) =>
          donation.id === id ? response.data : donation
        )
      );
      
      setSuccessMessage(`Donation #${id} status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(`Failed to update donation to ${newStatus}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await axios.patch(`donations/notifications/${id}/`, {
        is_read: true,
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      "Accepted": "bg-success",
      "Delivered": "bg-primary",
      "Collected": "bg-info",
      "Pending": "bg-warning",
      "Cancelled": "bg-danger",
    };
    return statusMap[status] || "bg-secondary";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="dashboard-title">
                <i className="bi bi-shield-lock-fill me-2"></i>
                Admin Dashboard
              </h1>
              <p className="dashboard-subtitle">
                Monitor donations, manage users, and track system-wide impact
              </p>
            </div>
            <div className="col-md-4">
              <div className="dashboard-header-actions">
                <button 
                  className="btn btn-light me-2"
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh dashboard"
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
        {/* Notifications */}
        <NotificationPanel />
        
        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccessMessage(null)}
              aria-label="Close success message"
            ></button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close error message"
            ></button>
          </div>
        )}

        {/* Stats Cards - Row 1 */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-box-seam"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalDonations}</h3>
                <p className="stat-label">Total Donations</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.pending}</h3>
                <p className="stat-label">Pending</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.accepted}</h3>
                <p className="stat-label">Accepted</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-truck"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.collected}</h3>
                <p className="stat-label">Collected</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-flag-checkered"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.delivered}</h3>
                <p className="stat-label">Delivered</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-star-fill"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalPoints.toLocaleString()}</h3>
                <p className="stat-label">Total Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Row 2 */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="stat-card">
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-egg-fried"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalMeals.toLocaleString()}</h3>
                <p className="stat-label">Total Meals Provided</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="stat-card">
              <div className="stat-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-tree-fill"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalCO2} kg</h3>
                <p className="stat-label">Total CO₂ Saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "donations" ? "active" : ""}`}
              onClick={() => setActiveTab("donations")}
              id="donations-tab"
              role="tab"
              aria-controls="donations-panel"
              aria-selected={activeTab === "donations"}
            >
              <i className="bi bi-box-seam me-2"></i>
              Donations Management
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
              id="notifications-tab"
              role="tab"
              aria-controls="notifications-panel"
              aria-selected={activeTab === "notifications"}
            >
              <i className="bi bi-bell-fill me-2"></i>
              System Notifications
              {unreadCount > 0 && (
                <span className="badge bg-danger ms-2">{unreadCount}</span>
              )}
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
              id="analytics-tab"
              role="tab"
              aria-controls="analytics-panel"
              aria-selected={activeTab === "analytics"}
            >
              <i className="bi bi-graph-up me-2"></i>
              Analytics Overview
            </button>
          </li>
        </ul>

        {/* Tab Panels */}
        <div className="tab-content">
          {/* Donations Panel */}
          {activeTab === "donations" && (
            <div 
              className="tab-pane fade show active"
              id="donations-panel"
              role="tabpanel"
              aria-labelledby="donations-tab"
            >
              {loading ? (
                <div className="loading-state">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-secondary">Loading donations...</p>
                </div>
              ) : (
                <div className="donations-card">
                  <div className="donations-card-header">
                    <div className="row g-3 align-items-center">
                      <div className="col-md-6">
                        <h4 className="donations-title">
                          <i className="bi bi-list-ul me-2 text-primary"></i>
                          All Food Donations
                          <span className="badge bg-primary ms-3 rounded-pill">{filteredDonations.length}</span>
                        </h4>
                      </div>
                      <div className="col-md-6">
                        <div className="donations-filters">
                          <div className="search-wrapper">
                            <i className="bi bi-search search-icon"></i>
                            <input
                              type="text"
                              className="form-control search-input"
                              placeholder="Search food or donor..."
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
                    {filteredDonations.length === 0 ? (
                      <div className="empty-state">
                        <i className="bi bi-inbox empty-icon"></i>
                        <h5 className="mt-3">No donations found</h5>
                        <p className="text-secondary">
                          {searchTerm || statusFilter !== "all" 
                            ? "Try adjusting your filters" 
                            : "No donations in the system yet"}
                        </p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table donations-table">
                          <thead>
                            <tr>
                              <th className="ps-4">ID</th>
                              <th>Donor</th>
                              <th>Food Item</th>
                              <th>Quantity</th>
                              <th>Expiry</th>
                              <th>Status</th>
                              <th>Match Score</th>
                              <th>Impact</th>
                              <th>Points</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDonations.map((donation) => (
                              <tr key={donation.id}>
                                <td className="ps-4" data-label="ID">
                                  <span className="text-muted">#{donation.id}</span>
                                </td>
                                <td data-label="Donor">
                                  <div className="donor-info">
                                    <div className="donor-avatar">
                                      {donation.owner.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="donor-name">{donation.owner}</span>
                                  </div>
                                </td>
                                <td data-label="Food Item">
                                  <span className="fw-medium">{donation.food}</span>
                                </td>
                                <td data-label="Quantity">{donation.quantity}</td>
                                <td data-label="Expiry">
                                  <span className="expiry-text">
                                    {formatDate(donation.expiry)}
                                  </span>
                                </td>
                                <td data-label="Status">
                                  <span className={`badge ${getStatusBadgeClass(donation.status)}`}>
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
                                      ></div>
                                    </div>
                                    <span className="match-score-value">{donation.match_score}%</span>
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
                                <td data-label="Action">
                                  <select
                                    className="form-select form-select-sm status-select"
                                    aria-label={`Update status for donation ${donation.id}`}
                                    title="Update donation status"
                                    value={donation.status}
                                    onChange={(e) => updateStatus(donation.id, e.target.value)}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Collected">Collected</option>
                                    <option value="Delivered">Delivered</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Panel */}
          {activeTab === "notifications" && (
            <div 
              className="tab-pane fade show active"
              id="notifications-panel"
              role="tabpanel"
              aria-labelledby="notifications-tab"
            >
              <div className="notifications-card">
                <div className="card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-bell-fill me-2"></i>
                    System Notifications
                    <span className="badge bg-secondary ms-3">{notifications.length}</span>
                  </h4>
                </div>
                <div className="card-body p-0">
                  {notifications.length === 0 ? (
                    <div className="empty-state">
                      <i className="bi bi-bell-slash empty-icon"></i>
                      <h5 className="mt-3">No notifications</h5>
                      <p className="text-secondary">System notifications will appear here</p>
                    </div>
                  ) : (
                    <div className="notifications-list">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                          onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                        >
                          <div className="notification-icon">
                            <i className={`bi bi-${
                              notification.role === 'donor' ? 'gift' : 
                              notification.role === 'ngo' ? 'building' : 
                              notification.role === 'volunteer' ? 'bicycle' : 'shield'
                            }`}></i>
                          </div>
                          <div className="notification-content">
                            <div className="notification-header">
                              <span className="notification-role">{notification.role.toUpperCase()}</span>
                              <span className="notification-time">{formatDate(notification.created_at)}</span>
                            </div>
                            <p className="notification-message">{notification.message}</p>
                          </div>
                          <div className="notification-status">
                            <span className={`badge ${notification.is_read ? 'bg-success' : 'bg-warning'}`}>
                              {notification.is_read ? 'Read' : 'Unread'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Panel */}
          {activeTab === "analytics" && (
            <div 
              className="tab-pane fade show active"
              id="analytics-panel"
              role="tabpanel"
              aria-labelledby="analytics-tab"
            >
              <div className="analytics-card">
                <div className="card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-bar-chart-fill me-2"></i>
                    Donation Status Distribution
                  </h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="chart-container">
                        <h5>Food Donations by Status</h5>
                        <div className="status-chart">
                          <div className="chart-bar">
                            <div className="chart-label">Pending</div>
                            <div className="chart-progress">
                              <div 
                                className="chart-fill bg-warning"
                                data-progress-width={`${(stats.pending / (stats.totalDonations || 1)) * 100}%`}
                              ></div>
                            </div>
                            <div className="chart-value">{stats.pending}</div>
                          </div>
                          <div className="chart-bar">
                            <div className="chart-label">Accepted</div>
                            <div className="chart-progress">
                              <div 
                                className="chart-fill bg-success"
                                data-progress-width={`${(stats.accepted / (stats.totalDonations || 1)) * 100}%`}
                              ></div>
                            </div>
                            <div className="chart-value">{stats.accepted}</div>
                          </div>
                          <div className="chart-bar">
                            <div className="chart-label">Collected</div>
                            <div className="chart-progress">
                              <div 
                                className="chart-fill bg-info"
                                data-progress-width={`${(stats.collected / (stats.totalDonations || 1)) * 100}%`}
                              ></div>
                            </div>
                            <div className="chart-value">{stats.collected}</div>
                          </div>
                          <div className="chart-bar">
                            <div className="chart-label">Delivered</div>
                            <div className="chart-progress">
                              <div 
                                className="chart-fill bg-primary"
                                data-progress-width={`${(stats.delivered / (stats.totalDonations || 1)) * 100}%`}
                              ></div>
                            </div>
                            <div className="chart-value">{stats.delivered}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="summary-stats">
                        <h5>System Summary</h5>
                        <div className="summary-item">
                          <span className="summary-label">Total Food Donations:</span>
                          <span className="summary-value">{stats.totalDonations}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Total Meals Provided:</span>
                          <span className="summary-value">{stats.totalMeals.toLocaleString()}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Total CO₂ Saved:</span>
                          <span className="summary-value">{stats.totalCO2} kg</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Total Points Awarded:</span>
                          <span className="summary-value">{stats.totalPoints.toLocaleString()}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Completion Rate:</span>
                          <span className="summary-value">
                            {((stats.delivered / (stats.totalDonations || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;