import React, { forwardRef, useEffect, useState } from "react";
import { Paper, Typography } from "@mui/material";
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Scatter,
  Tooltip,
  Area,
  ComposedChart,
} from "recharts";
import { useSelector } from "react-redux";

const TotalCPU = forwardRef(({ timePart }, ref) => {
  const [filteredData, setFilteredData] = useState([]);

  const cpuUtilData=useSelector((store)=>store.totalCpuUtil.cpuUtilData);
  const cpuDotIndicator=useSelector((store)=>store.dotIndicator.dotIndicatorCPU);

  const scatterData = filteredData.map((entry, index) => ({
    timePart: entry.timePart,
    y: cpuDotIndicator[index]?.value || 0,
    fill: cpuDotIndicator[index]?.color || "transparent",
    r: cpuDotIndicator[index]?.pointRadius * 2 || 0,
  }));

  const CustomDot = (props) => {
    const { cx, cy, fill, value } = props;
    const radius = props.r || 5;
    return <circle cx={cx} cy={cy} r={radius} fill={fill} stroke="none" />;
  };

  useEffect(() => {
    // Filter the cpuData every time it changes
    const newFilteredData = cpuUtilData.filter((entry) =>
      entry.hasOwnProperty("avgCpu")
    );
    setFilteredData(newFilteredData);
  }, [cpuUtilData]); // Dependency array, effect runs when cpuData changes

  return (
    <div>
      <Paper
        ref={ref}
        style={{ overflowX: "auto", overflowY: "hidden" }}
        elevation={3}
      >
        <Typography variant="h6" align="center">
          Total CPU Utilization
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
              <ComposedChart width={730} height={250} data={filteredData}>
                <defs>
                  <linearGradient
                    id="colorUv"
                    x1="0.5"
                    y1="0.5"
                    x2="0.5"
                    y2="2"
                  >
                    <stop offset="5%" stopColor="#06D001" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1A4D2E" stopOpacity={0} />
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
                  ticks={[101, 100, 75, 50, 25, 0]}
                  hide
                />
                <Tooltip />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="avgCpu"
                  stroke="#1A4D2E"
                  fill="url(#colorUv)"
                  strokeWidth={3}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="avpCpuTotal"
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
                  dataKey="cpuStress"
                  stroke="#ffc658"
                  fill="#ffc658"
                  strokeWidth={3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Paper>
    </div>
  );
});

export default TotalCPU;
