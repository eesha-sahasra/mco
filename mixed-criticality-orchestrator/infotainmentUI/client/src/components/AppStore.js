import React from "react";
import { Typography, Paper, Box, Tooltip } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";

import { Videocam } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const AppStore = () => {
  const navigate = useNavigate();

  const handlePaperItemClick = (itemType) => {
    console.log(`Clicked on ${itemType} item`);
    if (itemType === "games") return navigate("/games");
    else if (itemType === "ott") return navigate("/ott");
  };

  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",
      }}
    >
      <Typography variant="h5" style={{ color: "white", fontWeight: "bold" }}>
        App Store
      </Typography>
      <Box
        sx={{
          display: "flex",
          padding: -1,
          marginTop: 6,
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          "&>:not(style)": { m: 5, width: 350, height: 350 },
        }}
      >
        <Tooltip title="Car Analytics">
          <Paper
            elevation={3}
            onClick={() => handlePaperItemClick("caranalytics")}
            sx={{
              cursor: "pointer",
              backgroundColor: "#FF6500",
              borderRadius: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <DirectionsCarIcon sx={{ fontSize: 100, color: "#ffffff" }} />
            <Typography
              variant="h6"
              sx={{ color: "#ffffff", marginTop: 2, textDecoration: "none" }}
            >
              Car Analytics
            </Typography>
          </Paper>
        </Tooltip>
        <Tooltip title="Games">
          <Paper
            elevation={3}
            onClick={() => handlePaperItemClick("games")}
            sx={{
              cursor: "pointer",
              backgroundColor: "#36C2CE",
              borderRadius: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <SportsEsportsIcon sx={{ fontSize: 100, color: "#ffffff" }} />
            <Typography
              variant="h6"
              sx={{ color: "#ffffff", marginTop: 2, textDecoration: "none" }}
            >
              Games
            </Typography>
          </Paper>
        </Tooltip>
        <Tooltip title="OTT">
          <Paper
            elevation={3}
            onClick={() => handlePaperItemClick("ott")}
            sx={{
              cursor: "pointer",
              backgroundColor: "black",
              borderRadius: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <Videocam sx={{ fontSize: 100, color: "#ffffff" }} />
            <Typography
              variant="h6"
              sx={{ color: "#ffffff", marginTop: 2, textDecoration: "none" }}
            >
              OTT
            </Typography>
          </Paper>
        </Tooltip>
      </Box>
    </div>
  );
};

export default AppStore;
