import React from "react";
import { Button } from "@mui/material";
import { BASE_URL } from "./config";

const SaveLog = ({
  setMessage,
  setShowMessage,
  activeButton,
  handleButtonClick,
}) => {
  const handleSaveLogs = async () => {
    try {
      const response = await fetch(`${BASE_URL}/save_logs`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Response received from backend ", data);
      setMessage(data.message);
      setShowMessage(true);
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
      handleButtonClick("saveLog");
    } catch (error) {
      console.error("Error saving logs:", error);
      setMessage("Error saving logs");
      setShowMessage(true); // Show the error message
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    }
  };

  const buttonClass = activeButton === "saveLog" ? "active" : "";

  return (
    <div className="saveLog-button-container">
      <Button
        className={`saveLog-button ${buttonClass}`}
        variant="contained"
        onClick={handleSaveLogs}
      >
        Save Logs
      </Button>
    </div>
  );
};

export default SaveLog;
