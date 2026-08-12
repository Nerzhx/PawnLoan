import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { Button } from "../../components/common/button";
import Input from "../../components/common/input";
import Spinner from "../../components/common/Spinner";
import { verifyEmail, resendEmailVerification } from "../../features/auth/authThunks";
import { selectAuthLoading, selectAuthError } from "../../features/auth/authSelectors";

/**
 * VerifyEmailPage
 * Handles email verification flow with token from URL params.
 * Shows loading, success, or error states with appropriate actions.
 */
const VerifyEmailPage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (token && !verificationAttempted) {
      dispatch(verifyEmail(token));
      setVerificationAttempted(true);
    }
  }, [token, dispatch, verificationAttempted]);

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!resendEmail || resendLoading) return;

    setResendLoading(true);
    try {
      await dispatch(resendEmailVerification(resendEmail)).unwrap();
      setResendEmail("");
    } catch (error) {
      console.error("Resend verification failed:", error);
    } finally {
      setResendLoading(false);
    }
  };

  const isSuccess = verificationAttempted && !isLoading && !error;

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
          boxShadow: "0 10px 45px rgba(30,58,138,0.08), 0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Logo Section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "48px", height: "48px",
            background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
            borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(30,58,138,0.25)",
          }}>
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "20px" }}>S</span>
          </div>
          <span style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", letterSpacing: "-0.02em" }}>
            PawnLoan
          </span>
        </div>

        {/* Content Section */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            margin: "0 0 8px",
            fontSize: "26px",
            fontWeight: "800",
            color: "#0f172a",
            letterSpacing: "-0.03em",
          }}>
            Email Verification
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
            {isLoading
              ? "Verifying your email address..."
              : isSuccess
              ? "Your email has been successfully verified!"
              : "We couldn't verify your email address."}
          </p>
        </div>

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
            <Spinner size="lg" className="text-accent" />
          </div>
        )}

        {isSuccess && (
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
            <div style={{
              color: "#166534",
              fontSize: "14.5px",
              lineHeight: "1.6",
              fontWeight: "500"
            }}>
              <p style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>
                Email verified!
              </p>
              <p style={{ margin: 0 }}>You can now log in to your account.</p>
            </div>

            <div style={{ marginTop: "24px" }}>
              <Link to="/login">
                <Button variant="primary" style={{ width: "100%" }}>
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div
            className="animate-fade-in"
            style={{
              padding: "24px",
              background: "#fef2f2",
              border: "1.5px solid #fecaca",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >
            <div style={{
              color: "#dc2626",
              fontSize: "14.5px",
              lineHeight: "1.6",
              fontWeight: "500"
            }}>
              <p style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>
                Verification Failed
              </p>
              <p style={{ margin: 0 }}>
                {error?.message || "The verification link is invalid or has expired."}
              </p>
            </div>

            <div style={{ marginTop: "24px" }}>
              <form onSubmit={handleResendVerification} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Input
                  label="Email Address"
                  id="resendEmail"
                  type="email"
                  placeholder="name@company.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <Button
                  variant="primary"
                  type="submit"
                  loading={resendLoading}
                  disabled={!resendEmail}
                  style={{ width: "100%" }}
                >
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;