import React from "react";

const SVGImage = ({
  color,
  style,
  commonPlaceIconsStyle,
  bgColor = "white",
  className,
}) => {
  const svgString = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.5 10.8333C12.5 14.9683 15.865 18.3333 20 18.3333C24.135 18.3333 27.5 14.9683 27.5 10.8333C27.5 6.69825 24.135 3.33325 20 3.33325C15.865 3.33325 12.5 6.69825 12.5 10.8333ZM33.3333 34.9999H35V33.3333C35 26.9016 29.765 21.6666 23.3333 21.6666H16.6667C10.2333 21.6666 5 26.9016 5 33.3333V34.9999H33.3333Z" fill="${bgColor}"/>
</svg>
  `.trim();
  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  return <img className={className} src={svgDataUrl} style={style} alt="svg icon" />;
};
export default SVGImage;
