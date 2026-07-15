import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AiOutlineMail,
  AiOutlineDashboard,
  AiOutlineShop,
  AiOutlineUser,
  AiOutlinePhone,
  AiOutlineEnvironment,
} from "react-icons/ai";
import { MdOutlineRestaurant, MdOutlineSmartphone } from "react-icons/md";
import { getOTp, createUser } from "services";
import useToast from "hooks/useToast";
import useAuth from "hooks/useAuth";

const features = [
  {
    icon: <MdOutlineRestaurant />,
    title: "Smart Booking",
    desc: "Easy table reservations",
  },
  {
    icon: <AiOutlineDashboard />,
    title: "Full Management",
    desc: "Control your restaurant",
  },
  {
    icon: <MdOutlineSmartphone />,
    title: "Mobile-First Design",
    desc: "Works everywhere",
  },
];

export default function Login() {
  const { showToast } = useToast();
  const [{ data }, { setAuth, getAuth, getUserInfoData  }] = useAuth();
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("guest");
  const [mobileError, setMobileError] = useState("");
  const navigate = useNavigate();
  const [otpTimer, setOtpTimer] = useState(0);
  const [showOTPSent, setShowOTPSent] = useState(false);
  const [enableOTPsent, setEnableOTPsent] = useState(true);
  const [inProgress, setInProgress] = useState(false);
  const [isTokenSuccess, setIsTokenSuccess] = useState();
  const [getOTPnumber, setGetOTPnumber] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeForm, setActiveForm] = useState(false);
  const [createForm, setCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobilenumber: "",
    location: "",
  });
  const [errorMsg, setErrorMsg] = useState({
    firstName: false,
    lastName: false,
    email: false,
    mobilenumber: false,
    location: false,
  });

  const handleCheckMobilenumber = (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

    setMobile(digitsOnly);
    setEnableOTPsent(digitsOnly.length !== 10);

    if (!digitsOnly || digitsOnly.length === 10) {
      setMobileError("");
      return;
    }

    setMobileError("Please enter a valid 10-digit mobile number");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }
    setGetOTPnumber("");
    setShowOTPSent(true);
    setOtpTimer(60);
    try {
      const response = getOTp({
        mobilenumber: mobile,
      });
      response.then((res) => {
        if (res.success) {
          showToast({ message: res.message, variant: "success" });
          setOtpTimer(60);
          const timer = setInterval(() => {
            setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
          }, 1000);
          return () => clearInterval(timer);
        } else {
          showToast({ message: res.message, variant: "danger" });
        }
      });
    } catch (error) {
      // Handle errors
      showToast({ message: error, variant: "danger" });
    }
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  setInProgress(true);

  const response = await getAuth({
    mobilenumber: mobile,
    otp: getOTPnumber,
  });

  if (response?.data?.success) {
    // Load profile
    await getUserInfoData();

    showToast({
      title: "Welcome!",
      message: response.data.message,
      variant: "success",
    });

    navigate("/dashboard", { replace: true });
  } else {
    setInProgress(false);
    showToast({
      message: response.data.message,
      variant: "danger",
    });
  }
};
  const handleSubmitForm = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    const updatedFormData = {
      ...formData, // Keep the existing properties
      mobilenumber: mobile,
      name: formData.firstName + " " + formData.lastName, // Combine firstName and lastName into name
    };
    delete updatedFormData.firstName; // Remove firstName
    delete updatedFormData.lastName; // Remove lastName
   
    // TRIGGER API CALL TO REGISTER AGENCY USER
    try {
      const response = createUser(updatedFormData);
      response.then((res) => {
        if (res.success) {
          showToast({ message: res.message, variant: "success" });
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            mobilenumber: "",
            location: "",
          });
          setActiveForm(true);
          setCreateForm(false);
        } else {
          showToast({ message: res.data.message, variant: "danger" });
          setCreateForm(true);
        }
      });
    } catch (error) {
      // Handle errors
      showToast({ message: error, variant: "danger" });
    }
  };

  return (
    <div className="tableflow-login">
      <aside className="tableflow-login__brand">
        <Link to="/" className="tableflow-login__logo">
          Table Bokking
        </Link>

        <div className="tableflow-login__brand-content">
          <h1>Welcome Back to Table Bokking</h1>
          <p>
            Manage your restaurant or make your next reservation. Choose your
            role and get started.
          </p>

          <div className="tableflow-login__features">
            {features.map((item) => (
              <div className="tableflow-login__feature" key={item.title}>
                <span className="tableflow-login__feature-icon">
                  {item.icon}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="tableflow-login__copyright">
          © 2026 TableFlow. All rights reserved.
        </p>
      </aside>

      <main className="tableflow-login__panel">
        <div className="tableflow-login__card" id="get-started">
          <div className="tableflow-login__mobile-brand">
            <Link to="/" className="tableflow-login__logo">
              TableFlow
            </Link>
            <p>Sign in to your account</p>
          </div>
          {!createForm && (
            <div
              className="tableflow-login__role-toggle"
              aria-label="Account role"
            >
              <button
                type="button"
                className={role === "guest" ? "active" : ""}
                onClick={() => setRole("guest")}
              >
                <AiOutlineUser />
                Guest
              </button>
              <button
                type="button"
                className={role === "restaurant" ? "active" : ""}
                onClick={() => setRole("restaurant")}
              >
                <AiOutlineShop />
                Restaurant
              </button>
            </div>
          )}
          {!createForm && (
            <form className="tableflow-login__form" onSubmit={handleSubmit}>
              <label>
                <span>Mobile Number</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => handleCheckMobilenumber(e.target.value)}
                  maxLength="10"
                  aria-invalid={Boolean(mobileError)}
                  required
                />
                {mobileError && (
                  <small className="tableflow-login__error">
                    {mobileError}
                  </small>
                )}
              </label>
              {showOTPSent && (
                <label>
                  <span>OTP</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={getOTPnumber}
                    onChange={(e) => setGetOTPnumber(e.target.value)}
                    required
                  />
                </label>
              )}
              <div className="tableflow-login__otp-actions">
                {!showOTPSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={enableOTPsent}
                    className="tableflow-login__otp-button tableflow-login__otp-button--primary"
                  >
                    Send OTP
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpTimer > 0}
                    className="tableflow-login__otp-button tableflow-login__otp-button--secondary"
                  >
                    {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowOTPSent(false);
                    setOtpTimer(0);
                  }}
                  className="tableflow-login__otp-button tableflow-login__otp-button--ghost"
                >
                  Change Number
                </button>
              </div>
              {showOTPSent && (
                <button
                  type="submit"
                  className="tableflow-login__submit"
                  onClick={handleLogin}
                  disabled={inProgress || getOTPnumber.length < 6}
                >
                  {inProgress && (
                    <span className="tableflow-login__button-spinner" />
                  )}
                  {inProgress ? "Signing In..." : "Sign In"}
                </button>
              )}
            </form>
          )}
          {createForm && (
            <form className="modern-form" onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label className="form-label">
                  First Name <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <AiOutlineUser className="input-icon" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstName: e.target?.value,
                      })
                    }
                    placeholder="First name"
                    className="modern-input"
                    maxLength="50"
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div className="input-wrapper">
                  <AiOutlineUser className="input-icon" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastName: e.target?.value,
                      })
                    }
                    placeholder="Last name"
                    className="modern-input"
                    maxLength="50"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Email <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <AiOutlineMail className="input-icon" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target?.value,
                      })
                    }
                    placeholder="your@email.com"
                    className="modern-input"
                  />
                </div>
                {errorMsg.email && (
                  <span className="error-text">Please enter a valid email</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mobile Number <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <AiOutlinePhone className="input-icon" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => handleCheckMobilenumber(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="modern-input"
                    maxLength="10"
                  />
                </div>
                {mobileError && (
                  <small className="tableflow-login__error">
                    {mobileError}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Location <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <AiOutlineEnvironment className="input-icon" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: e.target?.value,
                      })
                    }
                    placeholder="Your location"
                    className="modern-input"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="tableflow-login__create-account"
                disabled={isSubmitted}
              >
                {isSubmitted ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}
          {/* 
          <div className="tableflow-login__divider">
            <span>Or continue with</span>
          </div>

          <div className="tableflow-login__social">
            <button type="button">
              <AiOutlineApple />
              Apple
            </button>
            <button type="button">
              <FcGoogle />
              Google
            </button>
          </div> */}

          <p
            className={`tableflow-login__signup ${
              createForm ? "tableflow-login__signup--create" : ""
            }`}
          >
            {createForm ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setCreateForm(!createForm)}
              className="tableflow-login__signup-link"
            >
              {createForm ? "Sign In" : "Sign up"}
            </button>
          </p>
          {!createForm && (
            <div className="tableflow-login__tip">
              <strong>Pro Tip:</strong> Add TableFlow to your home screen for
              quick access. Look for "Install" or "Add to Home Screen" in your
              browser menu.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
