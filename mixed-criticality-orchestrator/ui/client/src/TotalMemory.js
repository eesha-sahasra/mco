import { Paper, Typography } from "@mui/material";
import React, { forwardRef, useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Scatter,
} from "recharts";
import { useSelector } from "react-redux";

const TotalMemory = forwardRef(({ timePart }, ref) => {
  const [filteredData, setFilteredData] = useState([]);
  const memoryUtilData=useSelector((store)=>store.totalMemoryUtil.memoryUtilData);
  const memoryDotIndicator=useSelector((store)=>store.dotIndicator.dotIndicatorMemory);

  const scatterData = filteredData.map((entry, index) => ({
    timePart: entry.timePart,
    y: memoryDotIndicator[index]?.value || 0,
    fill: memoryDotIndicator[index]?.color || "transparent",
    r: memoryDotIndicator[index]?.pointRadius * 2 || 15,
  }));

  const CustomDot = (props) => {
    const { cx, cy, fill, value } = props;
    const radius = props.r || 5;
    return <circle cx={cx} cy={cy} r={radius} fill={fill} stroke="none" />;
  };

  useEffect(() => {
    const newFilteredData = memoryUtilData.filter((entry) =>
      entry.hasOwnProperty("avgMemory")
    );
    setFilteredData(newFilteredData);
  }, [memoryUtilData]);

  return (
    <div>
      <Paper
        ref={ref}
        elevation={3}
        style={{ overflowX: "auto", overflowY: "hidden" }}
      >
        <Typography variant="h6" align="center">
          Total Memory Utilization
        </Typography>
        <div style={{ display: "flex", width: "120%", height: "175px" }}>
          <div
            style={{
              position: "sticky",
              left: 0,
              background: "#fff",
              zIndex: 1,
              width: "75px",
            }}
          >
            <ResponsiveContainer width={70} height={147}>
              <ComposedChart data={filteredData}>
                <YAxis
                  ticks={[101, 100, 75, 50, 25, 0]}
                  domain={[0, 100]}
                  padding={{ top: 4, bottom: 2 }}
                  tick={{ fontWeight: "bold", fill: "#000000" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{ width: "120%", height: "175px", marginLeft: "-5px" }}
            className="custom-scrollbar"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredData} padding="5px">
                <defs>
                  <linearGradient
                    id="memoryGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FA8072" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FA8072" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timePart"
                  tick={{ fontWeight: "bold", fill: "#000000" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontWeight: "bold", fill: "#000000" }}
                  ticks={[0, 25, 50, 75, 100]}
                  hide
                />
                <Tooltip />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="avgMemory"
                  stroke="#CD1818"
                  fill="url(#memoryGradient)"
                  strokeWidth={3}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="avpMemoryTotal"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                />
                <Scatter
                  data={scatterData}
                  dataKey="y"
                  fill="red"
                  shape={<CustomDot />}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="memoryStress"
                  stroke="#ffc658"
                  fill="#ffc658"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Paper>
    </div>
  );
});
export default TotalMemory;
