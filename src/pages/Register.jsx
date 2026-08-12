import { useCallback, useEffect } from "react";
import { Link } from 'react-router-dom';
import { Button } from "../components/common/button";
import Input from "../components/common/input";
import { RadioOption } from "../components/common/radioOption";
import PasswordInput from '../components/common/passwordInput';
import { FcGoogle } from "react-icons/fc";
import { SiStellar } from "react-icons/si";

// form & validation
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../features/auth/authThunks';
import { registerSchema } from '../features/auth/authValidation';
import { clearAuthError } from '../features/auth/authSlice';
import { selectAuthError, selectAuthFieldErrors } from '../features/auth/authSelectors';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const reduxError = useSelector(selectAuthError);
  const fieldErrors = useSelector(selectAuthFieldErrors);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      role: 'donor',
      password: '',
      confirmPassword: '',
    },
  });

  // Clear Redux errors on unmount so stale errors don't persist
  useEffect(() => {
    return () => { dispatch(clearAuthError()); };
  }, [dispatch]);

  const handleCreate = useCallback(
    async (data) => {
      const result = await dispatch(registerUser(data));
      if (registerUser.fulfilled.match(result)) {
        navigate('/login');
      }
      // On rejection, error/fieldErrors are set in Redux state via extraReducers
    },
    [dispatch, navigate]
  );

  // Clear Redux errors when the user starts typing in any field
  const handleFieldChange = useCallback(
    (originalOnChange) => (e) => {
      if (reduxError || Object.keys(fieldErrors).length > 0) {
        dispatch(clearAuthError());
      }
      originalOnChange(e);
    },
    [reduxError, fieldErrors, dispatch]
  );

  return (
      <div 
      className="min-h-screen w-154 sm:w-auto bg-linear-to-br from-blue-100 via-sky-100 to-blue-50 flex items-center justify-center p-4 sm:p-6"
      >
        <form onSubmit={handleSubmit(handleCreate)} style={{
          background: "#fff",
          borderRadius: "18px",
          padding: "36px 32px 32px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 8px 40px rgba(30,58,138,0.10), 0 1px 4px rgba(0,0,0,0.04)",
          animation: "fadeUp 0.45s ease both",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          margin: "20px"
        }}>

          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "42px", height: "42px",
              background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(30,58,138,0.30)",
            }}>
              <span style={{ color: "#fff", fontWeight: "700", fontSize: "18px", 
                // fontFamily: "'Outfit', sans-serif" 
                }}>S</span>
            </div>
            <span style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", 
              // fontFamily: "'Outfit', sans-serif", 
              letterSpacing: "-0.01em" }}>
              PawnLoan
            </span>
          </div>

          {/* Heading */}
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              margin: "0 0 6px",
              fontSize: "24px",
              // fontFamily: "'Playfair Display', serif",
              fontWeight: "700",
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}>
              Create Account
            </h1>
            <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b", 
              // fontFamily: "'Outfit', sans-serif" 
              }}>
              Join our transparent giving community
            </p>
          </div>

          {/* Email */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                onChange={handleFieldChange(field.onChange)}
                label="Email Address"
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            )}
          />
          {/* Show yup validation error OR backend field error for email */}
          {(errors.email || fieldErrors.email) && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.email || errors.email?.message}
            </p>
          )}

          {/* Role selection */}
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span
                  style={{ fontSize: "13px", fontWeight: "700", color: "#374151" }}
                >
                  I want to
                </span>
                <RadioOption
                  id="donor"
                  name="role"
                  value="donor"
                  label="Support projects (Donor)"
                  checked={field.value === "donor"}
                  onChange={() => { handleFieldChange(() => field.onChange("donor"))(); }}
                />
                <RadioOption
                  id="creator"
                  name="role"
                  value="creator"
                  label="Create a campaign (Creator)"
                  checked={field.value === "creator"}
                  onChange={() => { handleFieldChange(() => field.onChange("creator"))(); }}
                />
              </div>
            )}
          />
          {errors.role && (
            <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
          )}

          {/* Password */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordInput
                {...field}
                onChange={handleFieldChange(field.onChange)}
                label="Password"
                id="password"
                showStrength={true}
                autoComplete="new-password"
              />
            )}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <PasswordInput
                {...field}
                onChange={handleFieldChange(field.onChange)}
                label="Confirm Password"
                id="confirm-password"
                autoComplete="new-password"
              />
            )}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}

          {/* General backend error alert — shown above the submit button */}
          {reduxError && (
            <div
              role="alert"
              style={{
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                color: "#dc2626",
              }}
            >
              {reduxError}
            </div>
          )}

          {/* Primary CTA */}
          <Button
            variant="primary"
            type="submit"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Creating Account…" : "Create Account"}
          </Button>

          {/* <OrDivider /> */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "12px", color: "#94a3b8", 
              // fontFamily: "'Outfit', sans-serif" 
              }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {/* Social / Wallet */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Button variant="secondary" onClick={() => {}}>
              {/* <GoogleIcon /> */}
              <FcGoogle size={"20px"} />
              Continue with Google
            </Button>
            <Button variant="secondary" onClick={() => {}}>
              {/* <StellarIcon /> */}
              <SiStellar size={"20px"} color="#1e3a8a" />
              Connect Stellar Wallet
            </Button>
          </div>

          {/* Sign-in link */}
          <p style={{
            margin: 0,
            textAlign: "center",
            fontSize: "13px",
            color: "#64748b",
            // fontFamily: "'Outfit', sans-serif",
          }}>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#1d4ed8",
                fontWeight: "600",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#1e3a8a"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#1d4ed8"}
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
  );
};

export default Register;