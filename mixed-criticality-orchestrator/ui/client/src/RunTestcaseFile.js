import React from "react";
import { Button } from "@mui/material";
import { BASE_URL } from "./config";

const RunTestcaseFile = ({
  setMessage,
  setShowMessage,
  setCurrentValue,
  activeButton,
  handleButtonClick,
}) => {
  const handleTestcaseFile = async () => {
    setCurrentValue(65);

    try {
      const filepath = "../../ui/logs/testcase.csv";
      const response = await fetch(`${BASE_URL}/execute_testcase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_path: filepath, status: "true" }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Response received from backend ", data);
      setMessage(data.message);
//      setShowMessage(true);
      // setTimeout(() => {
      //   setCurrentValue(0);
      //   setShowMessage(false);
      // }, 2000);
    } catch (error) {
      console.error("Error running testcase file:", error);
      setMessage("Error running testcase file, file not found");
  //    setShowMessage(true);
      // setTimeout(() => setShowMessage(false), 2000);
    }
  };

  const buttonClass = activeButton === "runTestcaseFile" ? "active" : "";

  return (
    <div className="runTestcase-button-container">
      <Button
        className={`runTestCaseButton ${buttonClass}`}
        variant="contained"
        onClick={handleTestcaseFile}
      >
        Run Testcase
      </Button>
    </div>
  );
};

export default RunTestcaseFile;
