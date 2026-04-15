import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const getDashboardPath = () => {
    switch (role) {
      case "donor":     return "/donor-dashboard";
      case "ngo":       return "/ngo-dashboard";
      case "volunteer": return "/volunteer-dashboard";
      case "admin":     return "/admin-dashboard";
      default:          return "/";
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          FoodBridge
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#foodbridgeNavbar"
          aria-controls="foodbridgeNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="foodbridgeNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {token ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to={getDashboardPath()}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    <i className="bi bi-person-circle me-1" />
                    Profile
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Home
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center">
            {!token ? (
              <>
                <Link to="/login" className="btn btn-outline-light me-2">
                  Login
                </Link>
                <Link to="/register" className="btn btn-warning">
                  Register
                </Link>
              </>
            ) : (
              <>
                <span className="text-light me-3 small">
                  <i className="bi bi-person-fill me-1" />
                  {username}{" "}
                  <span className="opacity-75">({role})</span>
                </span>
                <button onClick={handleLogout} className="btn btn-danger btn-sm">
                  <i className="bi bi-box-arrow-right me-1" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;