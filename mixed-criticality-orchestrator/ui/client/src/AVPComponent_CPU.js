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
import { useSelector } from "react-redux";

const AVPComponent = forwardRef(({ timePart }, ref) => {
  // State to hold the continuously updated data
  const [data, setData] = useState([]);
  const avpCpu = useSelector((store) => store.avpCpu.avgAvpCpu);

  useEffect(() => {
    // Update the data state to include the new incoming props
    setData((currentData) => [...currentData, { time: timePart, avp: avpCpu }]);
  }, [avpCpu, timePart]); // Dependencies array, effect runs when these props change

  return (
    <div>
      <Paper
        elevation={3}
        ref={ref}
        style={{ overflowX: "auto", overflowY: "hidden" }}
      >
        <Typography variant="h6" align="center">
          AVP_CPU
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
              <ComposedChart data={avpCpu}>
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
            style={{
              width: "120%",
              height: "175px",
            }}
            className="custom-scrollbar"
          >
            {/* <div style={{ width: "120%", height: "100%" }}> */}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient
                    id="avp_color"
                    x1="0.5"
                    y1="0.5"
                    x2="0.5"
                    y2="2"
                  >
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
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
                <Area
                  type="monotone"
                  dataKey="avp"
                  stroke="#8884d8"
                  fill="url(#avp_color)"
                  isAnimationActive={false}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Paper>
    </div>
  );
});

export default AVPComponent;
