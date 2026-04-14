import { Link } from "react-router-dom";

const PaymentCancel = () => {
  return (
    <div className="auth-page">
      <div className="card border-0 shadow-lg" style={{ maxWidth: 440 }}>
        <div className="card-body p-5 text-center">
          <i className="bi bi-x-circle-fill text-warning display-1 mb-3"></i>
          <h3 className="fw-bold mb-2">Payment Cancelled</h3>
          <p className="text-muted mb-4">
            Your donation was not processed. No charges were made.
            You can try again anytime.
          </p>
          <Link to="/donor-dashboard" className="btn btn-primary w-100 fw-semibold">
            <i className="bi bi-arrow-left me-2"></i>
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;