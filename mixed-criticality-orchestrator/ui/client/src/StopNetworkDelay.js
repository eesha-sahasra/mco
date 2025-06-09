import React from "react";
import { Button } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "./config";

const StopNetworkDelay = ({
  setMessage,
  setShowMessage,
  activeButton,
  handleButtonClick,
  setCurrentValue,
}) => {
  const handleStopNetworkDelay = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/stop_network_delay`);
      console.log(response.data);
      setMessage(response.data.message); // Set message from backend response
      setShowMessage(true); // Show the message after Stop button click
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
      handleButtonClick("stopNetworkDelay");
      // network delay value
      setCurrentValue(0);
    } catch (error) {
      console.error("Error stopping network delay:", error);
      setMessage("Error stopping network delay"); // Set error message in case of failure
      setShowMessage(true); // Show the error message
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    }
  };

  const buttonClass = activeButton === "stopNetworkDelay" ? "active" : "";

  return (
    <div className="stop-network-delay-container">
      <Button
        className={`stop-network-delay-button ${buttonClass}`}
        variant="contained"
        color="error"
        onClick={handleStopNetworkDelay}
      >
        Stop Network Delay
      </Button>
    </div>
  );
};

export default StopNetworkDelay;
