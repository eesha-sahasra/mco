import React from "react";
import { Typography } from "@mui/material";
import "@fontsource/dseg7"; // Import the DSEG7 font

const Speedometer = ({ speed, vehicleState}) => {

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Typography
          variant="h2"
          sx={{
            fontFamily: "'DSEG7', sans-serif",
            color: speed === 0 ? "red" : "white",
            marginTop: "10px",
            letterSpacing: "5px",
            fontSize: "100px",
          }}
        >
          {String(speed).padStart(1, "0")}
        </Typography>
        <Typography variant="h4" sx={{ marginTop: "10px", color: "white" }}>
          km/h
        </Typography> 
        {vehicleState === "park" && (
          <img
            src="/parkspeed.png"
            alt="Parking Mode"
            style={{
              width: "100%",
              maxWidth: "180px",
              height: "auto",
              objectFit: "contain",
              marginTop: "10px",
            }}
          />
        )}
        {vehicleState === "drive" && (
          <img
            src="/drivespeed.png"
            alt="Driving Mode"
            style={{
              width: "100%",
              maxWidth: "180px",
              height: "auto",
              objectFit: "contain",
              marginTop: "10px",
            }}
          />
        )}
    </div>
  );
};

export default Speedometer;
