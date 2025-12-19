import React from "react";
import { Link } from "react-router-dom";

const NotFound = ({ code, name }) => {
  const notFound = {
    "404": "404",
    page_not_found: "Oops! Page not found.",
    content:
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
    "403": "403",
    "500": "500",
    message_403: "Access Forbidden",
    content_403:
      "You tried to access a page you did not have prior authorization for.",
    message_400: "Not Found",
    content_400: "We couldn't find what you searched for. Try searching again.",
    message_500: "Internal Server Error",
    content_500: "We apologize for the inconvenience. Please try again later.",
    back_to_home: "Back To Home",
  };

  // Determine message and content based on code
  let errorMessage = notFound.page_not_found;
  let errorContent = notFound.content;

  if (code) {
    if (notFound[`message_${code}`]) {
      errorMessage = name ? `${name} ${notFound[`message_${code}`]}` : notFound[`message_${code}`];
    }
    if (notFound[`content_${code}`]) {
      errorContent = notFound[`content_${code}`];
    }
  }

  return (
    <div className="not-found">
      <div className="not-found-content">
        {code !== "400" && (
          <div className="error-code">
            {code ? `Not Found ${code}` : "404"}
          </div>
        )}
        <h2 className="error-message">{errorMessage}</h2>
        <p className="error-description">{errorContent}</p>
        <Link to="/" className="not-found-content-button">
          {notFound.back_to_home}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
