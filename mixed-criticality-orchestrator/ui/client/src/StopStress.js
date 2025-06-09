import React from "react";
import axios from "axios";
import { Button, Box } from "@mui/material";
// import "./StopStress.css"; // Ensure you have your custom styles
import { BASE_URL } from "./config";

function StopStress({
  setMessage,
  setShowMessage,
  activeButton,
  handleButtonClick,
}) {
  const handleStopStress = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/stop_stress`);
      console.log(response.data);
      setMessage(response.data.message); // Set message from backend response
     // setShowMessage(true); // Show the message after Stop button click
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
      handleButtonClick("stopStress");
    } catch (error) {
      console.error("Error stopping stress:", error);
      setMessage("Error stopping stress"); // Set error message in case of failure
     // setShowMessage(true); // Show the error message
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    }
  };

  const buttonClass = activeButton === "stopStress" ? "active" : "";

  return (
    <Box className="stop-stress-container">
      <Button
        className={`stop-stress-button ${buttonClass}`}
        onClick={handleStopStress}
        variant="contained"
        color="error"
      >
        Stop Stress
      </Button>
    </Box>
  );
}

export default StopStress;
