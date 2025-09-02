import React, { useState, Fragment } from "react";

function TabComponent({tabItems}) {
  
  const [activeTab, setActiveTab] = useState("board");
  const activeTabItem = tabItems.find((tab) => tab.id === activeTab);

  return (
    <Fragment>
      <div className="tabs-container">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content p-3">
        {activeTabItem?.content}
      </div>
    </Fragment>
  );
}

export default TabComponent;
