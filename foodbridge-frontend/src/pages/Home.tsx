import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const stats = {
    mealsDelivered: "50K+",
    partners: "200+",
    volunteers: "1K+"
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            {/* Left Column - Main Content */}
            <div className="col-lg-6">
              <div className="hero-content">
                {/* Badge */}
                <div className="mb-3">
                  <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                    <i className="bi bi-star-fill me-1"></i>
                    Making a Difference Every Day
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="hero-title">
                  <span className="text-success">FoodBridge</span>
                  <br />
                  <span className="text-dark">Connecting Surplus to Service</span>
                </h1>

                {/* Description */}
                <p className="hero-description">
                  Join our mission to reduce food waste and fight hunger. 
                  Every meal saved is a life touched. Together, we can build 
                  a sustainable future where no food goes to waste.
                </p>

                {/* CTA Buttons */}
                <div className="cta-buttons">
                  <Link 
                    to="/register" 
                    className="btn btn-success btn-lg px-4 py-3 fw-semibold shadow-sm"
                  >
                    Get Started
                    <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                  <Link 
                    to="/login" 
                    className="btn btn-outline-success btn-lg px-4 py-3 fw-semibold"
                  >
                    Sign In
                    <i className="bi bi-box-arrow-in-right ms-2"></i>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="trust-indicators">
                  <div className="trust-item">
                    <i className="bi bi-shield-check fs-5 me-2"></i>
                    <span className="small">Secure Platform</span>
                  </div>
                  <div className="trust-item">
                    <i className="bi bi-people fs-5 me-2"></i>
                    <span className="small">Verified Partners</span>
                  </div>
                  <div className="trust-item">
                    <i className="bi bi-clock-history fs-5 me-2"></i>
                    <span className="small">24/7 Support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Visual */}
            <div className="col-lg-6">
              <div className="stats-container">
                {/* Main Stats Card */}
                <div className="stats-card">
                  <div className="stats-card-body">
                    <div className="heart-icon">
                      <i className="bi bi-heart-fill text-danger display-1"></i>
                    </div>
                    <h3 className="fw-bold mb-3">Impact We've Made</h3>
                    
                    {/* Stats Grid */}
                    <div className="row g-4 mt-2">
                      <div className="col-4">
                        <div className="stat-item">
                          <div className="stat-value">
                            {stats.mealsDelivered}
                          </div>
                          <small className="stat-label">
                            Meals Saved
                          </small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="stat-item">
                          <div className="stat-value">
                            {stats.partners}
                          </div>
                          <small className="stat-label">
                            Partners
                          </small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="stat-item">
                          <div className="stat-value">
                            {stats.volunteers}
                          </div>
                          <small className="stat-label">
                            Volunteers
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="decorative-circle-1"></div>
                <div className="decorative-circle-2"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="fw-bold mb-3">How FoodBridge Works</h2>
            <p className="text-secondary lead">Simple steps to make a big difference</p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-box-seam fs-1 text-success"></i>
                </div>
                <h4 className="fw-semibold mb-3">1. List Surplus Food</h4>
                <p className="text-secondary mb-0">
                  Restaurants and stores list their excess food that would otherwise go to waste.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-truck fs-1 text-success"></i>
                </div>
                <h4 className="fw-semibold mb-3">2. Connect & Collect</h4>
                <p className="text-secondary mb-0">
                  NGOs and volunteers pick up the food and transport it to those who need it most.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-emoji-smile fs-1 text-success"></i>
                </div>
                <h4 className="fw-semibold mb-3">3. Feed Communities</h4>
                <p className="text-secondary mb-0">
                  Food reaches shelters, food banks, and families, reducing hunger and waste.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container text-center py-4">
          <h2 className="display-6 fw-bold mb-3">Ready to Make an Impact?</h2>
          <p className="lead mb-4 cta-description">
            Join thousands of donors, NGOs, and volunteers fighting food waste together.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link 
              to="/register" 
              className="btn btn-light btn-lg px-5 py-3 fw-semibold text-success"
            >
              Start Today
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
            <Link 
              to="/about" 
              className="btn btn-outline-light btn-lg px-5 py-3 fw-semibold"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-copyright">
              <p className="mb-0">
                &copy; 2024 FoodBridge. All rights reserved.
              </p>
            </div>
            <div className="footer-links">
              <Link to="/about" className="footer-link">
                About
              </Link>
              <Link to="/contact" className="footer-link">
                Contact
              </Link>
              <Link to="/privacy" className="footer-link">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;