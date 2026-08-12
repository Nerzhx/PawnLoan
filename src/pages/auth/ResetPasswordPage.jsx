import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { HiArrowLeft } from "react-icons/hi";
import { Button } from "../../components/common/button";
import PasswordInput from "../../components/common/passwordInput";
import { resetPassword } from "../../features/auth/authThunks";
import { resetPasswordSchema } from "../../features/auth/authValidation";

/**
 * ResetPasswordPage
 * Allows users to reset their password using a token from email link.
 * Handles token validation, password reset, and appropriate error states.
 */
const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(!token);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
      token: token || "",
    },
  });

  const handleResetPassword = async (data) => {
    try {
      await dispatch(resetPassword({ token: data.token, password: data.password })).unwrap();
      setIsSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      // Check if error indicates expired/invalid token
      const errorMessage = error?.message?.toLowerCase() || "";
      if (
        errorMessage.includes("expired") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("token")
      ) {
        setIsExpired(true);
      }
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
          boxShadow: "0 10px 45px rgba(30,58,138,0.08), 0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Logo Section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
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
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "20px" }}>S</span>
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

        {/* Success State */}
        {isSuccess && (
          <div className="animate-fade-in">
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                }}
              >
                Password Reset!
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                Your password has been successfully reset.
              </p>
            </div>

            <div
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
                <p style={{ margin: 0 }}>Redirecting to login...</p>
              </div>
            </div>
          </div>
        )}

        {/* Expired Token State */}
        {isExpired && !isSuccess && (
          <div className="animate-fade-in">
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                }}
              >
                Link Expired
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                This password reset link has expired or is invalid.
              </p>
            </div>

            <div
              style={{
                padding: "24px",
                background: "#fef2f2",
                border: "1.5px solid #fecaca",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#991b1b",
                  fontSize: "14.5px",
                  lineHeight: "1.6",
                  fontWeight: "500",
                }}
              >
                <p style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>
                  This link has expired
                </p>
                <p style={{ margin: 0 }}>
                  Password reset links are valid for a limited time for security reasons.
                </p>
              </div>

              <div style={{ marginTop: "24px", borderTop: "1px solid #fee2e2", paddingTop: "16px" }}>
                <Link
                  to="/forgot-password"
                  style={{
                    color: "#1d4ed8",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "14px",
                    display: "inline-block",
                  }}
                >
                  Request a new reset link
                </Link>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
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
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Reset Password Form */}
        {!isSuccess && !isExpired && (
          <>
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
                Reset Password
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                Enter your new password below.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(handleResetPassword)}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* New Password */}
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    label="New Password"
                    id="password"
                    showStrength={true}
                    autoComplete="new-password"
                  />
                )}
              />
              {errors.password && (
                <p style={{ margin: "-12px 0 0", fontSize: "12px", color: "#dc2626" }}>
                  {errors.password.message}
                </p>
              )}

              {/* Confirm New Password */}
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    label="Confirm New Password"
                    id="confirmPassword"
                    showStrength={false}
                    autoComplete="new-password"
                  />
                )}
              />
              {errors.confirmPassword && (
                <p style={{ margin: "-12px 0 0", fontSize: "12px", color: "#dc2626" }}>
                  {errors.confirmPassword.message}
                </p>
              )}

              <Button
                variant="primary"
                type="submit"
                loading={isSubmitting}
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
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
                  Back to Login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
