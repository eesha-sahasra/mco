import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { BASE_URL } from "./config";

const useStyles = makeStyles({
  container: {
    marginBottom: "20px",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: "10px",
  },
  buttonsContainer: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
});

const StartNetworkDelay = ({
  setMessage,
  setShowMessage,
  activeButton,
  handleButtonClick,
  setCurrentValue,
}) => {
  const classes = useStyles();
  const [showDialog, setShowDialog] = useState(false);
  const [delay, setDelay] = useState("");

  const handleStartNetworkDelay = () => {
    setShowDialog(true);
    handleButtonClick("startNetworkDelay");
  };

  const handleOk = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/start_network_delay`, {
        delay,
      });
      console.log(response.data);
      setMessage(response.data.message); // Set message from backend response
      setShowMessage(true); // Show the message after OK button click
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
      setShowDialog(false); // Hide dialog after successful response
      // Network delay value
      setCurrentValue(95);
    } catch (error) {
      console.error("Error starting network delay:", error);
      setMessage("Error starting network delay"); // Set error message in case of failure
      setShowMessage(true); // Show the error message
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const buttonClass = activeButton === "startNetworkDelay" ? "active" : "";

  return (
    <Box className={`start-network-delay-container ${classes.container}`}>
      <Button
        className={`start-network-delay-button ${buttonClass}`}
        onClick={handleStartNetworkDelay}
        variant="contained"
        color="primary"
      >
        Start Network Delay
      </Button>
      <Dialog
        open={showDialog}
        onClose={handleCancel}
        sx={{
          "& .MuiDialog-paper": { borderRadius: "16px" }, // Adjust the value as needed
        }}
      >
        <DialogTitle sx={{ fontSize: "1.8rem" }}>
          Start Network Delay
        </DialogTitle>
        <DialogContent
          sx={{ fontSize: "1.3rem" }}
          className={classes.formContainer}
        >
          <TextField
            type="number"
            label="Enter Network Delay (ms)"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions className={classes.buttonsContainer}>
          <Button
            onClick={handleOk}
            variant="contained"
            color="primary"
            sx={{ borderRadius: "16px" }} // Adjust the value as needed
          >
            OK
          </Button>
          <Button
            onClick={handleCancel}
            variant="outlined"
            color="secondary"
            sx={{ borderRadius: "16px" }} // Adjust the value as needed
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StartNetworkDelay;
