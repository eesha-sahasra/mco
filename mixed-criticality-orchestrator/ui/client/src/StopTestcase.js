import { Box, Button } from "@mui/material";
import axios from "axios";
import React from "react";
import { BASE_URL } from "./config";

function StopTestcase({
  setMessage,
  setShowMessage,
  activeButton,
  handleButtonClick,
}) {
  const handleStopTestcase = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/stop_testcase`);
      console.log(response.data);
      setMessage(response.data.message); // Set message from backend response
//      setShowMessage(true); // Show the message after Stop button click
      handleButtonClick("stopTestcase");
    } catch (error) {
      console.error("Error stopping testcase:", error);
      setMessage("Error stopping testcase"); // Set error message in case of failure
  //    setShowMessage(true); // Show the error message
    }
  };

  const buttonClass = activeButton === "stopTestcase" ? "active" : "";

  return (
    <Box className="stop-testcase-container">
      <Button
        className={`stop-testcase-button ${buttonClass}`}
        onClick={handleStopTestcase}
        variant="contained"
        color="error"
      >
        Stop Testcase
      </Button>
    </Box>
  );
}

export default StopTestcase;

