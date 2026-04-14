import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "../api/axiosInstance";

interface MoneyDonation {
  id: number;
  amount: string;
  currency: string;
  ngo_name: string;
  payment_status: string;
  created_at: string;
  message: string;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [donation, setDonation] = useState<MoneyDonation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const capturePayment = async () => {
      // PayPal redirects back with ?paymentId=...&PayerID=...
      const paypalOrderId = searchParams.get("paymentId");
      const payerId = searchParams.get("PayerID");

      if (!paypalOrderId || !payerId) {
        setError("Missing payment confirmation details.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post<MoneyDonation>(
          "donations/money/capture/",
          {
            paypal_order_id: paypalOrderId,
            payer_id: payerId,
          }
        );
        setDonation(res.data);

        // Clean up localStorage
        localStorage.removeItem("pending_donation_id");
        localStorage.removeItem("pending_paypal_order_id");
      } catch {
        setError("Payment capture failed. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    capturePayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <h5>Confirming your payment...</h5>
          <p className="text-muted">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-page">
        <div className="card border-0 shadow-lg" style={{ maxWidth: 480 }}>
          <div className="card-body p-5 text-center">
            <i className="bi bi-x-circle-fill text-danger display-1 mb-3"></i>
            <h3 className="fw-bold text-danger">Payment Failed</h3>
            <p className="text-muted mb-4">{error}</p>
            <Link to="/donor-dashboard" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card border-0 shadow-lg" style={{ maxWidth: 480 }}>
        <div className="card-body p-5 text-center">
          {/* Success Icon */}
          <div
            className="rounded-circle d-inline-flex align-items-center
                        justify-content-center bg-success bg-opacity-10 mb-4"
            style={{ width: 80, height: 80 }}
          >
            <i className="bi bi-check-circle-fill text-success display-5"></i>
          </div>

          <h3 className="fw-bold text-success mb-2">Payment Successful!</h3>
          <p className="text-muted mb-4">
            Thank you for your generosity. Your donation makes a real difference.
          </p>

          {/* Donation Summary */}
          {donation && (
            <div className="bg-light rounded-3 p-4 text-start mb-4">
              <h6 className="fw-bold mb-3">Donation Summary</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Amount</span>
                <span className="fw-bold text-success">
                  ${donation.amount} {donation.currency}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">NGO</span>
                <span className="fw-semibold">{donation.ngo_name}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Status</span>
                <span className="badge bg-success">
                  {donation.payment_status}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Date</span>
                <span>
                  {new Date(donation.created_at).toLocaleDateString()}
                </span>
              </div>
              {donation.message && (
                <div className="mt-3 pt-3 border-top">
                  <small className="text-muted">Your message:</small>
                  <p className="mb-0 fst-italic">"{donation.message}"</p>
                </div>
              )}
            </div>
          )}

          <Link to="/donor-dashboard" className="btn btn-success w-100 fw-semibold">
            <i className="bi bi-house me-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;