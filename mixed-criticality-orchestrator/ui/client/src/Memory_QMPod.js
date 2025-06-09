import { Paper, Typography } from "@mui/material";
import React, { forwardRef, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const Memory_QMPod = forwardRef(({ podUsage_new, timePart }, ref) => {
  const [data, setData] = useState([]);
  const [appName, , memoryUsage] = podUsage_new;

  useEffect(() => {
    let newDataEntry = {};
    newDataEntry[`${appName}_memory`] = parseFloat(memoryUsage);
    newDataEntry.time = timePart;
    setData((currentData) => [...currentData, newDataEntry]);
  }, [podUsage_new, timePart]);

  return (
    <div>
      <Paper
        elevation={3}
        ref={ref}
        style={{ overflowX: "auto", overflowY: "hidden" }}
      >
        <Typography variant="h6" align="center">
          Memory QM Pod 1
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
              <ComposedChart data={data}>
                <YAxis
                  ticks={[100, 75, 50, 25, 0]}
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
              <AreaChart data={data}>
                <defs>
                  <linearGradient
                    id="colorCpu0"
                    x1="0.5"
                    y1="0.5"
                    x2="0.5"
                    y2="2"
                  >
                    <stop offset="5%" stopColor="#ebd100" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontWeight: "bold", fill: "#000000" }}
                />
                <YAxis
                  tick={{ fontWeight: "bold", fill: "#000000" }}
                  ticks={[0, 25, 50, 75, 100]}
                  hide
                />
                <Tooltip />
                {/* Dynamically generate Area components for each app for both CPU and memory */}
                <Area
                  type="monotone"
                  dataKey={`${appName}_memory`}
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Paper>
    </div>
  );
});

export default Memory_QMPod;
