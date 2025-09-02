import React, { useEffect, useState } from "react";

function ToggleSwitch({ toggled, onClick, ...props }) {
  const [isToggled, toggle] = useState()
useEffect(()=>{
  toggle(toggled);
},[toggled]);
  const callback = () => {
      toggle(!isToggled)
      onClick(!isToggled)
  }
  
  return (
    <div className="toggle-switch">
      <label className={`toggle-switch-label ${props?.status}`}>
        <input type="checkbox" defaultChecked={isToggled} onClick={callback} {...props}/>
        <span className="switch" />
      </label>
    </div>
  );
}
export default ToggleSwitch;