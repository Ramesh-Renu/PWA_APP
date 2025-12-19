import React, { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { loginBanner } from "../../assets/images/index";
import Spinner from "components/spinner/spinner.component";
import appConstants from "constant/common";
import useToast from "hooks/useToast";
import useAuth from "hooks/useAuth";
import { createUser, getOTp } from "services";
export default function Login() {
  const { showToast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const handleSendOtp = (e) => {
    e.preventDefault();
    setShowOTPSent(true);
    try {
      const response = getOTp({
        mobilenumber: mobile,
      });
      response.then((res) => {
        console.log("response", res);

        if (res.success) {
          showToast({ message: res.message, variant: "success" });
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
      appConstants.VALIDATION_PATTERNS.phonenumberHyphens
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
      appConstants.VALIDATION_PATTERNS.phonenumberHyphens
    ).test(value);
    if (checkNumber) {
      setGetOTPnumber(value);
    } else {
      setGetOTPnumber("");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("getOTPnumber", getOTPnumber);
    setInProgress(true);
    if (Number(getOTPnumber) === 123456) {
      setIsTokenSuccess(true);
      showToast({
        title: `${"Welcome"}!`,
        message: `${"You have successfully logged in to your account"}!`,
        variant: "success",
      });

      setActivateSignUpSuccess(true);
    } else {
      setInProgress(false);
      setIsTokenSuccess(false);
      showToast({
        title: `${"Welcome"}!`,
        message: `${"Inactive User"}!`,
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (isTokenSuccess) {
      getAuth({
        mobilenumber: mobile,
        otp: getOTPnumber,
      });
    }
  }, [isTokenSuccess]);

  useEffect(() => {
    if (activateSignUpSuccess) {
      // const hasOrdersAccess = isSuperAdmin || isAdmin;
      navigate("/home");
    }
  }, [activateSignUpSuccess]);
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
    <>
      <div className="login-page">
        <div className="login-form">
          <div className="login-form-banner">
            <img src={loginBanner} alt="Login" />
          </div>
          <div className="login-form-container">
            {" "}
            <p className="login-form-container-title">{"Welcome"}!</p>
            {!activeForm && (
              <>
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                  Login with Mobile
                </h2>
              </>
            )}
            <div className="login-form-signup">
              {" "}
              <div className="form-row">
                <div className="form-col">
                  <label className="input-label">
                    {"Mobile Number"} <sup>*</sup>{" "}
                  </label>
                  <input
                    ref={inputRef}
                    type="tel"
                    value={mobile}
                    onChange={(e) => handleCheckMobilenumber(e.target.value)}
                    style={{ height: "45px" }}
                    placeholder="Enter your mobile number"
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none w-100"
                  />
                </div>
              </div>
              {/* OTP Section */}
              {showOTPSent && !activeForm && (
                <div className="mt-3">
                  <label className="block text-gray-600 mb-1">OTP</label>
                  <input
                    type="text"
                    value={getOTPnumber}
                    onChange={(e) => handleCheckOTPNumber(e.target.value)}
                    placeholder="Enter OTP"
                    style={{ height: "45px" }}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none w-100"
                  />
                </div>
              )}
              {activeForm && (
                <Fragment>
                  <div className="form-row mt-3">
                    <div className="form-col">
                      <label className="input-label">
                        {"First name"} <sup>*</sup>{" "}
                      </label>
                      <input
                        className="input-type"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target?.value,
                          })
                        }
                        style={{ height: "45px" }}
                        placeholder={"First name"}
                        maxLength={"50"}
                        autofocus
                      />
                      <label className="error-msg">
                        {errorMsg.firstName === true && "First name"}
                      </label>
                    </div>
                    <div className="form-col">
                      <label className="input-label"> {"Last name"} </label>
                      <input
                        className="input-type"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lastName: e.target?.value,
                          })
                        }
                        style={{ height: "45px" }}
                        maxLength={"50"}
                        placeholder={"Last name"}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-col">
                      <label className="input-label">
                        {" "}
                        {"Email"} <sup>*</sup>{" "}
                      </label>
                      <input
                        className="input-type"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target?.value,
                          })
                        }
                        style={{ height: "45px" }}
                        placeholder={"Email"}
                      />
                      <label className="error-msg">
                        {errorMsg.email === true &&
                          formData.email === "" &&
                          "Please enter your email address."}
                        {errorMsg.email === true &&
                          formData.email !== "" &&
                          errorMsg.invalidEmail === true &&
                          "Please enter a valid email address."}
                      </label>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-col">
                      <label className="input-label">
                        {" "}
                        {"location"} <sup>*</sup>{" "}
                      </label>
                      <input
                        className="input-type"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: e.target?.value,
                          })
                        }
                        style={{ height: "45px" }}
                        placeholder={"Email"}
                      />
                      <label className="error-msg">
                        {errorMsg.email === true &&
                          formData.email === "" &&
                          "Please enter your location."}
                        {errorMsg.email === true &&
                          formData.email !== "" &&
                          errorMsg.invalidEmail === true &&
                          "Please enter a valid location."}
                      </label>
                    </div>
                  </div>
                  <button
                    className="login-form-container-button-common mt-10"
                    onClick={handleSubmitForm}
                  >
                    {"Sign Up"}
                  </button>{" "}
                </Fragment>
              )}
            </div>
            {!showOTPSent && !activeForm ? (
              <button
                onClick={handleSendOtp}
                className="login-form-container-button-common mt-3"
                disabled={enableOTPsent}
                style={{
                  background: !enableOTPsent
                    ? "#0bc1ba"
                    : "var(--color-primary)",
                }}
              >
                Send OTP
              </button>
            ) : (
              <>
                {inProgress && (
                  <button
                    className="login-form-container-button"
                    style={{
                      background: "var(--color-primary)",
                      width: "100%",
                      border: "none",
                      borderRadius: "6px",
                      height: "44px",
                      marginTop: "20px",
                    }}
                  >
                    <span>{"Loading"}...</span>
                  </button>
                )}
                {!inProgress && !activeForm && (
                  <div className="login-form-container-button form-row">
                    {/* LOGIN BUTTON */}
                    <div className="col-6">
                      <button
                        className="login-form-container-button-common"
                        style={{
                          background:
                            getOTPnumber.length > 0
                              ? "#0bc1ba"
                              : "var(--color-primary)",
                          width: "100%",
                          border: "none",
                          borderRadius: "6px",
                          height: "44px",
                          marginTop: "20px",
                        }}
                        onClick={(e) => handleLogin(e)}
                        disabled={getOTPnumber.length > 0 ? false : true}
                      >
                        {"Login"}
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        className="login-form-container-button-common"
                        style={{
                          background:
                            getOTPnumber.length > 0
                              ? "#0bc1ba"
                              : "var(--color-primary)",
                          width: "100%",
                          border: "none",
                          borderRadius: "6px",
                          height: "44px",
                          marginTop: "20px",
                        }}
                        onClick={(e) => handleLogin(e)}
                        disabled={getOTPnumber.length > 0 ? false : true}
                      >
                        {"Resend"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <p className="login-form-container-signupbtn">
              {!activeForm
                ? "Don't have an account"
                : "Already have an account"}{" "}
              <span
                onClick={() => {
                  setActiveForm(!activeForm);
                  setShowOTPSent(false);
                }}
              >
                {!activeForm ? "Signup" : "Login"}
              </span>{" "}
              ?
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
