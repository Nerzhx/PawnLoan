import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { Button } from "../../components/common/button";
import Input from "../../components/common/input";
import { forgotPassword } from "../../features/auth/authThunks";

/**
 * ForgotPasswordPage
 * Allows users to request a password reset link.
 * Meets requirements for loading states, spam prevention, and security.
 */
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || loading || submitted) return;

    setLoading(true);
    try {
      // The thunk now handles its own toastSuccess for all scenarios (success or secure-failure)
      await dispatch(forgotPassword(email)).unwrap();
    } catch (error) {
      // Technical log only, UI will transition to success state either way
      console.error("Forgot password request failed:", error);
    } finally {
      setLoading(false);
      setSubmitted(true); // Always transition to the professional success UI
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-blue-100 via-sky-100 to-blue-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="animate-fade-up"
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "40px 32px",
          width: "100%",
          maxWidth: "420px",
          boxShadow:
            "0 10px 45px rgba(30,58,138,0.08), 0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(30,58,138,0.25)",
            }}
          >
            <span
              style={{ color: "#fff", fontWeight: "700", fontSize: "20px" }}
            >
              S
            </span>
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#1e293b",
              letterSpacing: "-0.02em",
            }}
          >
            PawnLoan
          </span>
        </div>

        {/* Content Section */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "26px",
              fontWeight: "800",
              color: "#0f172a",
              letterSpacing: "-0.03em",
            }}
          >
            Forgot Password
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#64748b",
              lineHeight: "1.5",
            }}
          >
            {submitted
              ? "We've sent a recovery link to your email."
              : "Enter the email address associated with your account and we'll send you a link to reset your password."}
          </p>
        </div>

        {submitted ? (
          <div
            className="animate-fade-in"
            style={{
              padding: "24px",
              background: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#166534",
                fontSize: "14.5px",
                lineHeight: "1.6",
                fontWeight: "500",
              }}
            >
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "16px",
                  fontWeight: "700",
                }}
              >
                Check your inbox
              </p>
              <p style={{ margin: 0 }}>
                If this email matches an account in our system, you will receive
                a reset link shortly.
              </p>
            </div>

            <div
              style={{
                marginTop: "24px",
                borderTop: "1px solid #dcfce7",
                paddingTop: "16px",
              }}
            >
              <Link
                to="/login"
                style={{
                  color: "#1d4ed8",
                  textDecoration: "none",
                  fontWeight: "700",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <HiArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <Input
              label="Email Address"
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={submitted || !email}
            >
              {loading ? "Processing..." : "Send Reset Link"}
            </Button>

            <div style={{ textAlign: "center", marginTop: "4px" }}>
              <Link
                to="/login"
                style={{
                  color: "#64748b",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "13.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#1d4ed8")}
                onMouseLeave={(e) => (e.target.style.color = "#64748b")}
              >
                <HiArrowLeft size={14} />
                Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
