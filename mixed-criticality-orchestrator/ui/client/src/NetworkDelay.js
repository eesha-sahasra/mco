import axios from "axios";
import React, { useState } from "react";

function NetworkDelay({ setMessage, setShowMessage }) {
  const [delay, setDelay] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleNetworkDelay = () => {
    setShowForm(true);
  };

  const handleOk = async () => {
    try {
      // const response = await axios.post(
      //   "http://localhost:7654/start_network_delay",
      const response = await axios.post(
          "http://172.31.36.117:7654/start_network_delay",
        {
          delay,
        }
      );
      console.log(response.data);
      setMessage(response.data.message); // Set message from backend response
      setShowMessage(true); // Show the message after OK button click
      setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
      setShowForm(false); // Hide form after successful response
    } catch (error) {
      console.error("Error starting network delay:", error);
      setMessage("Error starting network delay"); // Set error message in case of failure
      setShowMessage(true); // Show the error message
      setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    }
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div>
      <button onClick={handleNetworkDelay}>Network Delay</button>
      {showForm && (
        <div>
          <input
            type="text"
            placeholder="Enter delay in ms"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
          />
          <button onClick={handleOk}>OK</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default NetworkDelay;
