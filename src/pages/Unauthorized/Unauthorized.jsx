import React from 'react';
import { useTranslation } from "react-i18next";

const Unauthorized = ({unAuthorizedUser}) => {
    const { t } = useTranslation();

    const setUnAuthorizedUser = ()=>{
        unAuthorizedUser();
    }
    return (
        <div className="not-found">
        <div className="not-found-content">
            <div className="error-code">{t("unauthorized.401")}</div>
            <h2 className="error-message">{t("unauthorized.unauthorized")}</h2>
            <p className="error-description">
                {t("unauthorized.content")}
            </p>
            <button onClick={setUnAuthorizedUser} className="not-found-content-button">
                {t("unauthorized.back_to_login")}
            </button>
        </div>
        </div>
    );
};

export default Unauthorized;