import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import axios from "../api/axiosInstance";

interface NGO {
  id: number;
  username: string;
  email: string;
}

interface MoneyDonationFormProps {
  onSuccess?: () => void;
}

const MoneyDonationForm = ({ onSuccess }: MoneyDonationFormProps) => {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedNgo, setSelectedNgo] = useState("");
  const [amount, setAmount] = useState("");
  const [currency] = useState("USD");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingNgos, setLoadingNgos] = useState(true);

  // Quick amount buttons
  const quickAmounts = [5, 10, 25, 50, 100];

  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        const res = await axios.get<NGO[]>("donations/ngos/");
        setNgos(res.data);
      } catch {
        setError("Failed to load NGOs. Please refresh.");
      } finally {
        setLoadingNgos(false);
      }
    };
    fetchNGOs();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedNgo) {
      setError("Please select an NGO to donate to.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      setError("Minimum donation amount is $1.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post<{
        paypal_order_id: string;
        approval_url: string;
        donation_id: number;
      }>("donations/money/create/", {
        ngo_id: selectedNgo,
        amount: parsedAmount,
        currency,
        message,
      });

      // Store donation ID so capture page can reference it
      localStorage.setItem("pending_donation_id", String(res.data.donation_id));
      localStorage.setItem("pending_paypal_order_id", res.data.paypal_order_id);

      setSuccess("Redirecting to PayPal...");

      // Redirect to PayPal approval page
      window.location.href = res.data.approval_url;

      onSuccess?.();
    } catch {
      setError("Failed to create payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-paypal me-2"></i>
          Donate Money via PayPal
        </h5>
      </div>

      <div className="card-body p-4">
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill"></i>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* NGO Selector */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              <i className="bi bi-building me-1"></i>
              Select NGO to Support
            </label>
            {loadingNgos ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <div className="spinner-border spinner-border-sm"></div>
                Loading NGOs...
              </div>
            ) : (
              <select
                className="form-select"
                value={selectedNgo}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setSelectedNgo(e.target.value)
                }
                required
              >
                <option value="">-- Choose an NGO --</option>
                {ngos.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.username}
                  </option>
                ))}
              </select>

              
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              <i className="bi bi-currency-dollar me-1"></i>
              Select Amount (USD)
            </label>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`btn btn-sm ${
                    amount === String(q)
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setAmount(String(q))}
                >
                  ${q}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="Or enter custom amount"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <span className="input-group-text">USD</span>
            </div>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              <i className="bi bi-chat-heart me-1"></i>
              Message (optional)
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Leave an encouraging message for the NGO..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
            />
            <div className="form-text text-end">{message.length}/300</div>
          </div>

          {/* PayPal Info Banner */}
          <div className="alert alert-info d-flex align-items-start gap-2 py-2 mb-4">
            <i className="bi bi-info-circle-fill mt-1 flex-shrink-0"></i>
            <div>
              <strong>Secure PayPal Checkout</strong>
              <br />
              <small>
                You'll be redirected to PayPal to complete the payment safely.
                Your financial details are never stored on our servers.
              </small>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold"
            disabled={loading || loadingNgos}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Connecting to PayPal...
              </>
            ) : (
              <>
                <i className="bi bi-paypal me-2"></i>
                Donate ${amount || "0.00"} via PayPal
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MoneyDonationForm;