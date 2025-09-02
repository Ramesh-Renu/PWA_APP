import React, { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { loginBanner } from "../../assets/images/index";
import Spinner from "components/spinner/spinner.component";
import { useTranslation } from "react-i18next";
import appConstants from "constant/common";
import useToast from "hooks/useToast";

export default function Login() {
  const { showToast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activateSignUpSuccess, setActivateSignUpSuccess] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [data, setData] = useState([]);
  const [mobile, setMobile] = useState("");
  const [getOTPnumber, setGetOTPnumber] = useState("");
  const [showOTPSent, setShowOTPSent] = useState(false);
  const [enableOTPsent, setEnableOTPsent] = useState(true);
  const [activeForm, setActiveForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errorMsg, setErrorMsg] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  });
  const handleSendOtp = (e) => {
    e.preventDefault();
    setShowOTPSent(true);
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
      showToast({
        title: `${t("common.welcome")}!`,
        message: `${t("login.success_msg")}!`,
        variant: "success",
      });
      setActivateSignUpSuccess(true);
    } else {
      setInProgress(false);
      showToast({
        title: `${t("common.welcome")}!`,
        message: `${t("login.inactive_user")}!`,
        variant: "danger",
      });
    }
  };

  useEffect(() => {}, []);

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

    // TRIGGER API CALL TO REGISTER AGENCY USER
    // try {
    const requestData = {
      firstname: formData.firstName,
      lastname: formData.lastName,
      email: formData.email,
      phone_number: formData.phone,
    };
    // const response = userSignUp(requestData);
    //   response.then((res) => {
    //     if (res.data.status) {
    //       dispatch(
    //         showToast({ message: res.data.message, variant: "success" })
    //       );
    //       setActivateSignUpSuccess(true);
    //       setTimeout(() => {
    //         setActivateSignUpSuccess(false);
    //         setActiveForm("login")
    //       }, [5000]);
    //     } else {
    //       dispatch(
    //         showToast({ message: res.data.message, variant: "danger" })
    //       );
    //     }
    //   });
    // } catch (error) {
    //   // Handle errors
    //   dispatch(showToast({ message: error, variant: "danger" }));
    // }
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
            <p className="login-form-container-title">{t("common.welcome")}!</p>
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
                    {t("login.mobile_number")} <sup>*</sup>{" "}
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
                        {t("login.label.firstname")} <sup>*</sup>{" "}
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
                        placeholder={t("login.label.firstname")}
                        maxLength={"50"}
                        autofocus
                      />
                      <label className="error-msg">
                        {errorMsg.firstName === true &&
                          t("login.error.firstname")}
                      </label>
                    </div>
                    <div className="form-col">
                      <label className="input-label">
                        {" "}
                        {t("login.label.lastname")}{" "}
                      </label>
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
                        placeholder={t("login.label.lastname")}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-col">
                      <label className="input-label">
                        {" "}
                        {t("login.label.email")} <sup>*</sup>{" "}
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
                        placeholder={t("login.label.email")}
                      />
                      <label className="error-msg">
                        {errorMsg.email === true &&
                          formData.email === "" &&
                          t("login.error.email")}
                        {errorMsg.email === true &&
                          formData.email !== "" &&
                          errorMsg.invalidEmail === true &&
                          t("login.error.invalidEmail")}
                      </label>
                    </div>
                  </div>
                  <button
                    className="login-form-container-button-common mt-10"
                    onClick={handleSubmitForm}
                  >
                    {t("login.sign_up")}
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
                    <span>{t("common.loading")}...</span>
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
                        {t("login.login")}
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
                        {t("login.resend")}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <p className="login-form-container-signupbtn">
              {!activeForm ? t("login.no_account") : t("login.have_account")}{" "}
              <span onClick={() => {setActiveForm(!activeForm); setShowOTPSent(false)}}>
                {!activeForm ? t("login.signup") : t("login.login")}
              </span>{" "}
              ?
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
