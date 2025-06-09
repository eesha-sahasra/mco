import React, { useState } from "react";
import axios from "axios";
import { Button, Input, Paper } from "@mui/material";
import { BASE_URL } from "./config";

const UploadFile = ({ setMessage, setShowMessage }) => {
  const [selectedFile, setSelectedFile] = useState();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(`${BASE_URL}/upload`, formData);
      console.log(response.data);
      setMessage(response.data.message);
      setShowMessage(true);
    } catch (err) {
      console.error("Error uploading file:", err);
      setMessage("Error uploading file");
      setShowMessage(true);
    }
  };

  return (
    <Paper elevation={3}>
      <div>
        <Input
          type="file"
          inputProps={{ accept: ".csv" }}
          onChange={handleFileChange}
        />
      </div>
      <center>
        <Button
          variant="contained"
          color="primary"
          onClick={handleFormSubmit}
          disabled={!selectedFile}
          marginTop="10px"
        >
          Upload
        </Button>
      </center>
    </Paper>
  );
};

export default UploadFile;
