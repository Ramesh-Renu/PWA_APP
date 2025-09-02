import React from "react";
import accessRequired from "../../assets/images/index";
const AccessRequired = () => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <img src={accessRequired} alt="AccessImage"  className="w-25" />
        <h2 className="error-message mt-3">{"Access Required"}</h2>
        <p className="error-description-access">
          {"You don’t currently have permission to view Boards."}
        </p>
        <p className="error-description-access">
          {
            "Kindly contact the Admin or Product team to get the required access and board permissions"
          }
        </p>
      </div>
    </div>
  );
};

export default AccessRequired;
