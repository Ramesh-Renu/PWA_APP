import React, { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { loginBanner } from "../../assets/images/index";
import appConstants from "constant/common";
import useToast from "hooks/useToast";
import useAuth from "hooks/useAuth";
import { createUser, getOTp } from "services";
import { AiOutlineMail, AiOutlinePhone, AiOutlineUser, AiOutlineEnvironment } from "react-icons/ai";
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";

export default function Login() {
  const { showToast } = useToast();
  const [{ data }, { setAuth, getAuth }] = useAuth();
  const navigate = useNavigate();
  const [activateSignUpSuccess, setActivateSignUpSuccess] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [mobile, setMobile] = useState("");
  const [isTokenSuccess, setIsTokenSuccess] = useState();
  const [getOTPnumber, setGetOTPnumber] = useState("");
  const [showOTPSent, setShowOTPSent] = useState(false);
  const [enableOTPsent, setEnableOTPsent] = useState(true);
  const [activeForm, setActiveForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  const [otpTimer, setOtpTimer] = useState(0);
  const handleSendOtp = (e) => {
    e.preventDefault();
    setShowOTPSent(true);
    setOtpTimer(60);
    try {
      const response = getOTp({
        mobilenumber: mobile,
      });
      response.then((res) => {
        console.log("response", res);

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

  const handleCheckMobilenumber = (value) => {
    const checkNumber = new RegExp(
      appConstants.VALIDATION_PATTERNS.phonenumberHyphens,
    ).test(value);
    if (checkNumber) {
      const trimmed = value.slice(0, 10);

      setMobile(trimmed);
      setEnableOTPsent(trimmed?.length === 10 ? false : true);
    } else {
      setErrorMsg({
        ...errorMsg,
        phone: true,
      });
      setMobile("");
    }
  };

  const handleCheckOTPNumber = (value) => {
    const checkNumber = new RegExp(
      appConstants.VALIDATION_PATTERNS.phonenumberHyphens,
    ).test(value);
    if (checkNumber) {
      setGetOTPnumber(value);
    } else {
      setGetOTPnumber("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setInProgress(true);
    const response = await getAuth({
      mobilenumber: mobile,
      otp: getOTPnumber,
    });

    if (response.data.success) {
      setIsTokenSuccess(true);
      showToast({
        title: `${"Welcome"}!`,
        message: response.data.message,
        variant: "success",
      });
      navigate("/hotel");
      setActivateSignUpSuccess(true);
    } else {
      setInProgress(false);
      setIsTokenSuccess(false);
      showToast({
        message: response.data.message,
        variant: "danger",
      });
    }
  };

  /** AUTO FOCUS ON FIRST INPUT FIELD */
  const inputRef = useRef(null);
  useEffect(() => {
    if (activeForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeForm]);
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
      // localStorage.setItem("token","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibW9iaWxlbnVtYmVyIjoiOTg3NjU0MzIxMCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY2MTM5ODYzLCJleHAiOjE3NjYxNDA3NjN9.7HNbuciiOysoDkHEMMG46HPiewzWBJqtGd8ZIEF_4bo", updatedFormData);

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
        } else {
          showToast({ message: res.data.message, variant: "danger" });
        }
      });
    } catch (error) {
      // Handle errors
      showToast({ message: error, variant: "danger" });
    }
  };
  return (
    <div className="modern-login-container">
      <div className="login-left-section">
        <div className="login-brand">
          <h1 className="brand-title">HotelApp</h1>
          <p className="brand-subtitle">Table Reservation System</p>
        </div>
        <div className="login-illustration">
          <img src={loginBanner} alt="Hotel Booking" />
        </div>
        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <p>Quick & Easy Booking</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <p>Real-Time Availability</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <p>Secure & Reliable</p>
          </div>
        </div>
      </div>

      <div className="login-right-section">
        <div className="login-card">
          {!activeForm ? (
            <div className="login-form-wrapper">
              <div className="form-header">
                <h2>{!showOTPSent ? "Welcome Back" : "Enter OTP"}</h2>
                <p>{!showOTPSent ? "Sign in to your account" : "We've sent an OTP to your mobile"}</p>
              </div>

              <form className="modern-form">
                {!showOTPSent ? (
                  <div className="form-group">
                    <label className="form-label">
                      Mobile Number <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <AiOutlinePhone className="input-icon" />
                      <input
                        ref={inputRef}
                        type="tel"
                        value={mobile}
                        onChange={(e) => handleCheckMobilenumber(e.target.value)}
                        placeholder="Enter your 10-digit mobile number"
                        className="modern-input"
                        maxLength="10"
                      />
                    </div>
                    {errorMsg.phone && (
                      <span className="error-text">Please enter a valid phone number</span>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        OTP <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          value={getOTPnumber}
                          onChange={(e) => handleCheckOTPNumber(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="modern-input"
                          maxLength="6"
                        />
                      </div>
                    </div>
                    {otpTimer > 0 && (
                      <p className="otp-timer">OTP expires in: {otpTimer}s</p>
                    )}
                  </>
                )}

                <div className="form-button-group">
                  {!showOTPSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={enableOTPsent}
                      className="btn btn-primary btn-block"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleLogin(e)}
                        disabled={getOTPnumber.length < 6 || inProgress}
                        className="btn btn-primary btn-block"
                      >
                        {inProgress ? "Logging in..." : "Login"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpTimer > 0}
                        className="btn btn-secondary btn-block"
                      >
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOTPSent(false);
                          setGetOTPnumber("");
                          setOtpTimer(0);
                        }}
                        className="btn btn-text btn-block"
                      >
                        Change Number
                      </button>
                    </>
                  )}
                </div>
              </form>

              <div className="divider">
                <span>Don't have an account?</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveForm(true);
                  setShowOTPSent(false);
                }}
                className="btn btn-outline btn-block"
              >
                Create New Account
              </button>
            </div>
          ) : (
            <div className="signup-form-wrapper">
              <div className="form-header">
                <h2>Create Account</h2>
                <p>Join us today to start booking tables</p>
              </div>

              <form className="modern-form">
                <div className="form-row">
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
                  type="button"
                  onClick={handleSubmitForm}
                  className="btn btn-primary btn-block btn-lg"
                >
                  Sign Up
                </button>
              </form>

              <div className="divider">
                <span>Already have an account?</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveForm(false);
                  setShowOTPSent(false);
                  setMobile("");
                  setGetOTPnumber("");
                }}
                className="btn btn-outline btn-block"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>© 2024 HotelApp. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
