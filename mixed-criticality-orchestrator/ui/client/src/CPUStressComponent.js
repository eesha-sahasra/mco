import { Paper, Typography } from "@mui/material";
import React, { forwardRef } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";

const StressComponent = forwardRef(({ stressData }, ref) => {
  const cpuStressData = useSelector((store) => store.stress.cpuStressData);
  //have to replace the stressData with cpuStressData

  return (
    <div>
      <Paper
        ref={ref}
        style={{ overflowX: "auto", overflowY: "hidden" }}
        elevation={3}
      >
        <Typography variant="h6" align="center">
          CPU Stress Spike
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
              <ComposedChart data={cpuStressData}>
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
              <AreaChart data={cpuStressData}>
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
                  dataKey="cpuStress"
                  stroke="#ffc658"
                  fill="#ffc658"
                  strokeWidth={3}
                />
                <Scatter
                  data={cpuStressData}
                  dataKey="cpuStress"
                  fill="red"
                  shape="circle"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Paper>
    </div>
  );
});

export default StressComponent;
