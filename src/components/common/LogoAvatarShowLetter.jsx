/** This component created by Ramesh R ***/
import React, { Fragment } from "react";
import { colorCodeCardName } from "constant/ColorCodes";

const LogoAvatarShowLetter = ({
  genaralData,
  profilePhotoName,
  profileName,
  outerClassName,
  innerClassName,
  index,
}) => {
  const cleanedName = genaralData[profileName]
    ?.replace(/[^a-zA-Z\s]/g, "") // remove numbers and special chars
    ?.replace(/\s+/g, " ") // normalize multiple spaces
    ?.trim();

  const temp = colorCodeCardName?.filter(
    (c) => c?.name === cleanedName?.slice(0, 1)?.toLowerCase()
  )[0];

  const userName = cleanedName?.split(" ");

  const genaralDataPhoto = profilePhotoName
    ? genaralData[profilePhotoName]
    : genaralData?.photo || genaralData?.photoUrl;

  let initials;
  if (userName?.length === 1) {
    initials = userName[0]?.slice(0, 2)?.toUpperCase();
  } else {
    initials = userName
      ?.slice(0, 2)
      ?.map((name) => name?.slice(0, 1))
      ?.join("")
      ?.toUpperCase();
  }
  const userIcon = {
    // position: "relative",
    width: "100%",
    height: "100%",
    display: "block",
  };
  const userIconHead = {
    minWith: "6px",
    width: "30%",
    height: "25%",
    background: "#ffffff",
    borderRadius: "50%",
    position: "absolute",
    top: "20%",
    left: "35%",
  };
  const userIconBody = {
    minWith: "15px",
    width: "70%",
    height: "25%",
    background: "#ffffff",
    borderRadius: "50%/100% 100% 0 0",
    position: "absolute",
    bottom: "20%",
    left: "15%",
  };
  return (
    <Fragment>
      {genaralData?.logo &&
        (genaralDataPhoto !== undefined || genaralDataPhoto !== null) && (
          <div
            className={outerClassName ? outerClassName : ""}
            key={index ? index : "1"}
            id={index ? index : "1"}
          >
            {genaralData?.logo && (
              <img
                src={genaralData?.logo}
                alt="logo"
                className={innerClassName ? innerClassName : ""}
                title={genaralData[profileName]}
              />
            )}
            {genaralData?.userStatus && (
              <span
                className={`${
                  "user-profile__image__status icon-" +
                  `${
                    genaralData.userStatus === "active"
                      ? "online"
                      : genaralData?.userStatus === "busy"
                      ? "busy"
                      : "away"
                  }`
                }`}
              >
                {" "}
                <b>
                  {" "}
                  {genaralData?.userStatus === "active"
                    ? "Online"
                    : genaralData?.userStatus === "busy"
                    ? "Busy"
                    : "Away"}{" "}
                </b>
              </span>
            )}
          </div>
        )}
      {genaralDataPhoto && genaralData?.logo !== null && (
        <div
          className={outerClassName ? outerClassName : ""}
          key={index ? index : "1"}
          id={index ? index : "1"}
        >
          {genaralDataPhoto && genaralDataPhoto.length > 0 && (
            <img
              // src={`data:image/png;base64,${genaralDataPhoto}`}
              src={genaralDataPhoto}
              alt="userImage"
              className={innerClassName ? innerClassName : ""}
              title={genaralData[profileName]}
            />
          )}
          {genaralDataPhoto.length === 0 && (
            <div
              className={outerClassName ? outerClassName : ""}
              style={{
                backgroundColor: temp ? temp.color : colorCodeCardName[1].color,
              }}
              key={index ? index : "1"}
              id={index ? index : "1"}
            >
              <span
                className={innerClassName ? innerClassName : ""}
                title={genaralData[profileName]}
                aria-label="Broken Image"
              >
                {initials || "NA"}
              </span>
            </div>
          )}
          {genaralData?.userStatus && (
            <span
              className={`${
                "user-profile__image__status icon-" +
                `${
                  genaralData.userStatus === "active"
                    ? "online"
                    : genaralData?.userStatus === "busy"
                    ? "busy"
                    : "away"
                }`
              }`}
            >
              {" "}
              <b>
                {" "}
                {genaralData?.userStatus === "active"
                  ? "Online"
                  : genaralData?.userStatus === "busy"
                  ? "Busy"
                  : "Away"}{" "}
              </b>
            </span>
          )}
        </div>
      )}
      {((genaralData?.logo == null &&
        (genaralDataPhoto == null || genaralDataPhoto === "")) ||
        (genaralDataPhoto == null && genaralData?.logo !== undefined)) && (
        <div
          className={outerClassName ? outerClassName : ""}
          style={{
            backgroundColor: temp ? temp.color : colorCodeCardName[1].color,
          }}
          key={index ? index : "1"}
          id={index ? index : "1"}
        >
          {initials && (
            <span
              className={innerClassName ? innerClassName : ""}
              title={genaralData[profileName]}
            >
              {initials}
            </span>
          )}
          {!initials && (
            <div
              className={"no-image-name"}
              title={"No Image/Name"}
              style={{ position: "relative", width: "100%" }}
            >
              <div style={userIcon}>
                <div style={userIconHead}></div>
                <div style={userIconBody}></div>
              </div>
            </div>
          )}
          {genaralData?.userStatus && (
            <span
              className={`
                user-profile__image__status 
                icon- ${genaralData?.userStatus}
              `}
            ></span>
          )}
        </div>
      )}
    </Fragment>
  );
};

export default LogoAvatarShowLetter;
