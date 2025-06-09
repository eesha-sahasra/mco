import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "./config";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
} from "@mui/material";
import { makeStyles } from "@mui/styles";

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

const StartStress = ({
  setMessage,
  setShowMessage,
  activeButton,
  handleButtonClick,
}) => {
  const classes = useStyles();
  const [showDialog, setShowDialog] = useState(false);
  const [cpu, setCpu] = useState("");
  const [memory, setMemory] = useState("");

  const handleStartStress = () => {
    setShowDialog(true);
    handleButtonClick("startStress");
  };

  const handleOk = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/start_stress`, {
        cpu,
        memory,
      });
      console.log(response.data);
      setMessage(response.data.message); // Set message from backend response
     // setShowMessage(true); // Show the message after OK button click
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds

      setShowDialog(false); // Hide dialog after successful response
    } catch (error) {
      console.error("Error starting stress:", error);
      setMessage("Error starting stress"); // Set error message in case of failure
      //setShowMessage(true); // Show the error message
      // setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const buttonClass = activeButton === "startStress" ? "active" : "";

  return (
    <Box className={`start-stress-container ${classes.container}`}>
      <Button
        className={`start-stress-button ${buttonClass}`}
        onClick={handleStartStress}
        variant="contained"
        color="primary"
      >
        Start Stress
      </Button>
      <Dialog
        open={showDialog}
        onClose={handleCancel}
        sx={{
          "& .MuiDialog-paper": { borderRadius: "16px" }, // Adjust the value as needed
        }}
      >
        <DialogTitle sx={{ fontSize: "1.8rem" }}>Start Stress</DialogTitle>
        <DialogContent
          sx={{ fontSize: "1.3rem" }}
          className={classes.formContainer}
        >
          <TextField
            type="number"
            label="Enter CPU Load (0-100)"
            value={cpu}
            onChange={(e) => setCpu(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
          />
          <TextField
            type="number"
            label="Enter Memory Load (0-100)"
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
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

export default StartStress;
