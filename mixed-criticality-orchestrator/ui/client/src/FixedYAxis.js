// client/src/FixedYAxis.js
import React from "react";

const FixedYAxis = ({ data, height }) => {
  return (
    <div className="fixed-y-axis">
      {data.map((tick, index) => (
        <div key={index} className="y-axis-label">
          {tick}
        </div>
      ))}
    </div>
  );
};

export default FixedYAxis;

