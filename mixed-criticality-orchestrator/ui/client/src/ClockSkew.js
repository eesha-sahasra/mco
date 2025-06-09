import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import axios from "axios";
import { BASE_URL } from "./config";

const ClockSkewButton = ({
  setMessage,
  setShowMessage,
  activeButton,
  handleButtonClick,
}) => {
  const [skewSeconds, setSkewSeconds] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const handleAddClick = () => {
    setShowForm(true);
    handleButtonClick("addClockSkew");
  };

  const handleOkClick = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/add_clock_skew`, {
        skew_seconds: skewSeconds,
      });
      console.log(response.data);
      setMessage(response.data.message); // Set message from backend response
      setShowMessage(true); // Show the message after OK button click
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error starting stress"); // Set error message in case of failure
      setShowMessage(true); // Show the error message
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    }
    setShowForm(false);
  };

  const handleCancelClick = () => {
    setShowForm(false);
  };

  const buttonClass = activeButton === "addClockSkew" ? "active" : "";

  return (
    <div className="clock-skew-container">
      <Button
        className={`clock-skew-button ${buttonClass}`}
        variant="contained"
        onClick={handleAddClick}
      >
        Add Clock Skew
      </Button>
      <Dialog
        open={showForm}
        onClose={handleCancelClick}
        sx={{
          "& .MuiDialog-paper": { borderRadius: "16px" }, // Adjust the value as needed
        }}
      >
        <DialogTitle sx={{ fontSize: "1.8rem" }}>Enter Clock Skew</DialogTitle>
        <DialogContent sx={{ fontSize: "1.3rem" }}>
          <DialogContentText>
            Enter time in seconds (0-100 sec) to add clock skew.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="skew-seconds"
            label="Skew Seconds (0-100 sec)"
            type="number"
            fullWidth
            value={skewSeconds}
            onChange={(e) => setSkewSeconds(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelClick}
            variant="outlined"
            color="secondary"
            sx={{ borderRadius: "16px" }} // Adjust the value as needed
          >
            Cancel
          </Button>
          <Button
            onClick={handleOkClick}
            variant="contained"
            color="primary"
            sx={{ borderRadius: "16px" }} // Adjust the value as needed
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ClockSkewButton;
