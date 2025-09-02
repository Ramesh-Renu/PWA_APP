import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const NotFound = ({...props}) => {
    const { t } = useTranslation();
    return (
        <div className="not-found">
        <div className="not-found-content">
            {props.code !== "400" && <div className="error-code">{props.code? t("notFound."+props.code) : t("notFound.404")}</div> }
            <h2 className="error-message">
                {props?.code? ((props?.name ? props?.name+" " : "")+ t(`notFound.message_${props.code}`)) : t("notFound.page_not_found")}
                </h2>
            <p className="error-description">
                {props.code? t("notFound.content_"+props.code) : t("notFound.content")}
            </p>
            <Link to="/" className="not-found-content-button">
                {t("notFound.back_to_home")}
            </Link>
        </div>
        </div>
    );
};

export default NotFound;