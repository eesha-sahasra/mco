import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Grid,
  Button,
  Modal,
  Box,
} from "@mui/material";
import { SERVER_URL, BROWSER_TAB_URL } from "./config";
import axios from "axios";
import Speedometer from "./Speedometer";

function App() {
  const [selectedOption, setSelectedOption] = useState("none"); // Initial state is 'none'
  const [cpuProgress, setCpuProgress] = useState(0);
  const [asilCpuProgress, setAsilCpuProgress] = useState(0);
  const [qmCpuProgress, setQmCpuProgress] = useState(0);
  const [qmAvailableCpuProgress, setQmAvailableCpuProgress] = useState(0);
  const [memoryProgress, setMemoryProgress] = useState(0);
  const [qmAvailableMemoryProgress, setQmAvailableMemoryProgress] = useState(0);
  const [asilMemoryProgress, setAsilMemoryProgress] = useState(0);
  const [qmMemoryProgress, setQmMemoryProgress] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [selectedACC, setSelectedACC] = useState(""); // Separate state for ACC
  const [selectedLaneAssist, setSelectedLaneAssist] = useState("");
  const [parkStop, setParkStop] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [statusPopupMessage, setStatusPopupMessage] = useState("");
  const [speed, setSpeed] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [vehicleState, setVehicleState] = useState("park");
  const [runningGamesList, setRunningGamesList] = useState([]);
  const checkQmRunningValueUrl = `${SERVER_URL}/getQmRunningGames`;
  let browserTabUrl = `${BROWSER_TAB_URL}`;

  const popupStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: "10px",
  };

  const [windows, setWindows] = useState({
            reverse: [],
          });

  useEffect(() => {
    const retainAsilButtonState = async () => {
      try {
        const initialResponse = await fetch(`${SERVER_URL}/get_cpu_and_memory`);
        const initialData = await initialResponse.json();
        console.log("initialData", initialData)
        if (
          initialData.vehicle_state !== "" &&
          initialData.asil_running_apps !== undefined &&
          initialData.asil_stopped_apps !== undefined
        ) {
          const playApps = initialData.asil_running_apps;
          const stoppedApps = initialData.asil_stopped_apps;
          const selectedMode = initialData.vehicle_state;
          console.log("selectedMode", selectedMode)
          if (selectedMode == "park" || selectedMode == "ignition_off") {
            setIsDisabled(true);
            setActiveButton("park");
            setSpeed(0);
          } else {
            const getResponse = await fetch(`${SERVER_URL}/getSpeed`);
            const getData = await getResponse.json();
            if (getData.speed) {
              setSpeed(getData.speed); // Update speed in the UI
            }
            setIsDisabled(false);
            setActiveButton("drive");
          }
          // ACC
          playApps.forEach((app) => {
            if (app === "acc") {
              setSelectedACC("play");
            } else if (app === "laneassist") {
              setSelectedLaneAssist("play");
            }
          });
          // laneAssist
          stoppedApps.forEach((app) => {
            if (app === "acc") {
              setSelectedACC("stop");
            } else if (app === "laneassist") {
              setSelectedLaneAssist("stop");
            }
          });
        }
        // const getResponse = await fetch(`${SERVER_URL}/getSpeed`);
        // const getData = await getResponse.json();
        // if (getData.speed) {
        //   setSpeed(getData.speed); // Update speed in the UI
        // }
      } catch (error) {
        console.error(
          "Error fetching initial data to retain the game state",
          error
        );
      }
    };
    retainAsilButtonState();
    const interval = setInterval(fetchProgressData, 1000);
    return () => clearInterval(interval);
  }, []); // Only runs once when component mounts

  const fetchProgressData = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/get_cpu_and_memory`);
      const data = await response.json();

      if (
        data.cpu_progress !== undefined &&
        data.asil_cpu_progress !== undefined &&
        data.qm_cpu_progress !== undefined &&
        data.qm_available_cpu_progress !== undefined &&
        data.memory_progress !== undefined &&
        data.asil_memory_progress !== undefined &&
        data.qm_available_memory_progress !== undefined &&
        data.qm_memory_progress !== undefined
      ) {
        setCpuProgress(data.cpu_progress);
        setAsilCpuProgress(data.asil_cpu_progress);
        setQmCpuProgress(data.qm_cpu_progress);
        setQmAvailableCpuProgress(data.qm_available_cpu_progress);
        setMemoryProgress(data.memory_progress);
        setQmAvailableMemoryProgress(data.qm_available_memory_progress);
        setAsilMemoryProgress(data.asil_memory_progress);
        setQmMemoryProgress(data.qm_memory_progress);
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    }
  };

  const handleCancelClick = () => {
    setShowPopup(false);
    setShowStatusPopup(false);
  };

  const handleRadioChange = async (event) => {
    const newOption = event.target.value;

    if (newOption !== selectedOption) {
      // Only update if different
      setSelectedOption(newOption);

      try {
        const response = await fetch(`${SERVER_URL}/update_adas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adas_functionality: newOption }),
        });

        const data = await response.json();
        console.log("Updated:", data.message);
      } catch (error) {
        console.error("Error updating ADAS value:", error);
      }
    }
  };

  const handleParkClick = async () => {
    closeWindows("reverse");
    const updateDriveModeUrl = `${SERVER_URL}/update_drive_mode`;
    // setSelectedOption("none");
    setSelectedACC("");
    setSelectedLaneAssist("");
    setIsDisabled(true);
    setActiveButton("park");
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setSpeed(0);
    setVehicleState("park");
    try {
      await axios.post(updateDriveModeUrl, { "vehicle_drive_mode": "park" });
      const response = await fetch(`${SERVER_URL}/park`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_info: {
            vehicle_state: "park",
          },
        }),
      });
      const data = await response.json();
      console.log("Updated:", data.message);
    } catch (error) {
      console.error("Error updating vehicle state:", error);
    }
  };

  const openWindow = (reverseApp, url) => {
    console.log('reverseApp opened', reverseApp)
    const newWindow = window.open(url, "_blank");
    setWindows(prevWindows => ({
      ...prevWindows,
      [reverseApp]: [...prevWindows[reverseApp], newWindow],
    }));
    console.log('windows', windows);
  };

  const closeWindows = (reverseApp) => {
    console.log('closed window', reverseApp);
    setWindows(prevWindows => {
        prevWindows[reverseApp].forEach(win => {
            if (win) win.close();
        });
        return {
            ...prevWindows,
            [reverseApp]: [],
        };
    });
};

  const handleReverseViewClick = async () => {
    //update drive mode
    const updateDriveModeUrl = `${SERVER_URL}/update_drive_mode`;
    const checkQmValueUrl = `${SERVER_URL}/getAsilRunningApps`;
    setActiveButton("reverse");
    setIsDisabled("reverse");
    try {

      await axios.post(updateDriveModeUrl, { vehicle_drive_mode: "reverse" });
      const success = await pollASILRunningStatus("rearcamera", checkQmValueUrl);
      if (!success) {
        return;
      }

      console.error("Failed to start the apps");
      const response = await fetch(`${SERVER_URL}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_info: {
            vehicle_state: "reverse",
          },
        }),
      });
      const data = await response.json();
      console.log("Updated:", data.message);
      let reverseAppUrl=browserTabUrl;
      reverseAppUrl+=":8025";
      openWindow("reverse",reverseAppUrl);
      // window.open("http://172.31.45.221:8025", "_blank");
    } catch (error) {
      console.error("Error updating vehicle state:", error);
    }
  };

  const handleDriveClick = async () => {
    closeWindows("reverse");
    const updateDriveModeUrl = `${SERVER_URL}/update_drive_mode`;
    const checkQmValueUrl = `${SERVER_URL}/getAsilRunningApps`;
    setSpeed(50);
    setVehicleState("drive");

    try {
      await axios.post(updateDriveModeUrl, { "vehicle_drive_mode": "drive" });

      const success = await pollASILDriveRunningStatus(checkQmValueUrl);
      if (!success) {
        console.error("Failed to start the apps");
        return;
      }
      const newIntervalId = setInterval(async () => {
        try {
          // Generate and set a random speed in the backend
          const setResponse = await fetch(`${SERVER_URL}/setSpeed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const setData = await setResponse.json();
          console.log("Random Speed Set:", setData.speed);

          // Fetch the updated speed from the backend
          const getResponse = await fetch(`${SERVER_URL}/getSpeed`);
          const getData = await getResponse.json();
          if (getData.speed) {
            setSpeed(getData.speed); // Update speed in the UI
          }
        } catch (error) {
          console.error("Error updating or fetching speed:", error);
        }
      }, 2000); // Update every two seconds
      setIntervalId(newIntervalId);

      const response = await fetch(`${SERVER_URL}/drive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_info: {
            vehicle_state: "drive",
          },
        }),
      });
      const data = await response.json();
      console.log("Updated:", data.message);
      setSelectedACC("play");
      setSelectedLaneAssist("play");
      setIsDisabled(false);
      setActiveButton("drive");

      //Alert if any QM app is running when drive is enabled
      // const runningGamesResponse = await axios.get(checkQmRunningValueUrl);
      // console.log("qm_info_games_running_apps status test:", runningGamesResponse.data);

      // // Check if the gameName exists in the returned list
      // const runningGamesList = runningGamesResponse.data.qm_info_games_running_apps || [];
      // if (runningGamesList.length > 0) {
      //   setRunningGamesList(runningGamesList);
      //   setShowPopup(true);
      //   setPopupMessage(`Alert! QM App(s) ${runningGamesList.join(", ")} is/are running. Please stop the app(s) before driving.`);
      // }

    } catch (error) {
      console.error("Error updating vehicle state:", error);
    }
  };

  const pollResourceManagementLog = async (resourcesText, url) => {
    console.log('test')
    try {
      while (true) {
        const response = await axios.get(url);
        const logMessage = response.data.resource_management_log || "";

        if (logMessage && logMessage !== "null") {
          console.log("logMessage", logMessage);
          setShowStatusPopup(true);
          setStatusPopupMessage(logMessage)
          // logMessage == "null" ? setStatusPopupMessage("Initialization in progress...") : setStatusPopupMessage(logMessage);
        } else {
          // Received an empty string, stop polling and remove popup
          setShowStatusPopup(false);
          break;
        }

        // Wait for 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Error polling resource_management_log:", error);
    }
  };

  //Function to poll for both the ASIL apps
  const pollASILDriveRunningStatus = async (checkQmValueUrl) => {
    try {
      const response = await axios.get(checkQmValueUrl);
      console.log("asil_running_apps status:", response.data);

      // Check if the acc or laneassist exists in the returned list
      const runningAsilAppsList = response.data.asil_running_apps || [];
      const lackOfResources = response.data.lack_of_resources || {};
      const lackOfResourcesAsilApp = response.data.lack_of_resources.app;
      const insufficientResources = lackOfResources.insufficient_resources || [];
      const clearLackOfResourceUrl = `${SERVER_URL}/clear_lack_of_resources`;
      const resourceManagementLogUrl = `${SERVER_URL}/get_resource_management_log`;
      const isEmpty = (obj) => Object.keys(obj).length === 0;

      // Check if resources are insufficient
      // if (lackOfResourcesAsilApp === "acc" || lackOfResourcesAsilApp === "laneassist") {
      if (!isEmpty(lackOfResources)) {
        const resourcesText = insufficientResources.length > 0
          ? `(${insufficientResources.join(", ")})`
          : "";
        if (insufficientResources.length > 0) {
          setShowStatusPopup(true);
          setStatusPopupMessage(`Insufficient resources ${resourcesText} to launch the app. Clearing resources...`);
        }
        // Start polling "resource_management_log" to show priority based deletion of QM apps
        await pollResourceManagementLog(resourcesText, resourceManagementLogUrl);
        console.log('before clearing')
        // Clear lack_of_resource key in redis
        axios.post(clearLackOfResourceUrl)
          .then(response => console.log("Cleared Redis key:", response.data))
          .catch(error => console.error("Error clearing Redis key:", error));
        setShowStatusPopup(false);
        return true; // Stop polling
      }

      //Keep polling until both the apps aren't present in asil_running_apps key
      if (!runningAsilAppsList.includes("acc") && !runningAsilAppsList.includes("laneassist")) {
        setShowStatusPopup(true);
        setStatusPopupMessage("Initialization in progress...");
        // Continue polling every 2 seconds until the game is detected
        await new Promise(resolve => setTimeout(resolve, 2000));
        return pollASILDriveRunningStatus(checkQmValueUrl);
      } else {
        // AsilApp is now running, return success
        await axios.post(clearLackOfResourceUrl)
          .then(response => console.log("Cleared Redis key:", response.data))
          .catch(error => console.error("Error clearing Redis key:", error));
        setShowStatusPopup(false);
        console.log("ASIL apps are now running!");
        return true;
      }
    } catch (error) {
      console.error("Error polling asil_running_apps:", error);
      return false;
    }
  };

  //Function to poll for a particular ASIL app
  const pollASILRunningStatus = async (asilAppName, checkQmValueUrl) => {
    try {
      const response = await axios.get(checkQmValueUrl);
      console.log("asil_running_apps status:", response.data);

      // Check if the asilAppName exists in the returned list
      const runningAsilAppsList = response.data.asil_running_apps || [];
      const lackOfResources = response.data.lack_of_resources || {};
      const lackOfResourcesAsilApp = response.data.lack_of_resources.app;
      const insufficientResources = lackOfResources.insufficient_resources || [];
      const clearLackOfResourceUrl = `${SERVER_URL}/clear_lack_of_resources`;
      const resourceManagementLogUrl = `${SERVER_URL}/get_resource_management_log`;

      // Check if resources are insufficient
      if (lackOfResourcesAsilApp === asilAppName) {
        const resourcesText = insufficientResources.length > 0
          ? `(${insufficientResources.join(", ")})`
          : "";
        asilAppName == "acc" ? setSelectedACC("stop") : setSelectedLaneAssist("stop");
        setShowStatusPopup(true);
        setStatusPopupMessage(`Insufficient resources ${resourcesText} to launch the app. Clearing resources...`);

        // Start polling "resource_management_log" to show priority based deletion of QM apps
        await pollResourceManagementLog(resourcesText, resourceManagementLogUrl);

        axios.post(clearLackOfResourceUrl)
          .then(response => console.log("Cleared Redis key:", response.data))
          .catch(error => console.error("Error clearing Redis key:", error));
        setShowStatusPopup(false);
        return true; // Stop polling
      }

      if (!runningAsilAppsList.includes(asilAppName)) {
        setShowStatusPopup(true);
        setStatusPopupMessage("Initialization in progress...");
        // Continue polling every 2 seconds until the game is detected
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return pollASILRunningStatus(asilAppName, checkQmValueUrl);
      } else {
        // AsilApp is now running, return success
        setShowStatusPopup(false);
        console.log(`${asilAppName} is now running!`);
        return true;
      }
    } catch (error) {
      console.error("Error polling asil_running_apps:", error);
      return false;
    }
  };

  const handleACCChange = async (event) => {
    const setActionUrl = `${SERVER_URL}/setAction`;
    const checkQmValueUrl = `${SERVER_URL}/getAsilRunningApps`;
    const asilAppName = "acc";
    const newOption = event.target.value;
    console.log("newOption", newOption)
    setSelectedACC(newOption);

    try {
      await axios.post(setActionUrl, {
        appAction: newOption,
        appName: asilAppName,
      });

      if (newOption === "play") {
        const success = await pollASILRunningStatus(
          asilAppName,
          checkQmValueUrl
        );
        if (!success) {
          console.error(`Failed to start ${asilAppName}`);
          return;
        }
        setSelectedACC("play");
      }
      const response = await fetch(`${SERVER_URL}/update_adas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehiclestate_selection: { action: newOption, app: "acc" },
        }),
      });

      const data = await response.json();
      console.log("Updated:", data);
    } catch (error) {
      console.error("Error updating ADAS value:", error);
    }
  };

  const handleLaneAssistChange = async (event) => {
    const setActionUrl = `${SERVER_URL}/setAction`;
    const checkQmValueUrl = `${SERVER_URL}/getAsilRunningApps`;
    const asilAppName = "laneassist";
    const newOption = event.target.value;
    setSelectedLaneAssist(newOption);
    try {
      await axios.post(setActionUrl, {
        appAction: newOption,
        appName: asilAppName,
      });

      if (newOption === "play") {
        const success = await pollASILRunningStatus(
          asilAppName,
          checkQmValueUrl
        );
        if (!success) {
          console.error(`Failed to start ${asilAppName}`);
          return;
        }
        setSelectedLaneAssist("play");
      }
      const response = await fetch(`${SERVER_URL}/update_adas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehiclestate_selection: { action: newOption, app: "laneassist" },
        }),
      });

      const data = await response.json();
      console.log("Updated:", data.message);
    } catch (error) {
      console.error("Error updating ADAS value:", error);
    }
  };

  return (
    <div
      style={{
        justifyContent: "center",
        textAlign: "center",
        backgroundColor: "#f0f0f0",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        overflowX: "hidden",
      }}
    >
      <Modal open={showPopup} onClose={handleCancelClick}>
        <Box sx={popupStyle}>
          <Typography variant="h6" component="h2" gutterBottom>
            {popupMessage}
          </Typography>
          {
            // popupMessage.includes('sufficient') ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" color="secondary" onClick={handleCancelClick}>
                Cancel
              </Button>
            </Box>

          }
        </Box>
      </Modal>
      <Modal open={showStatusPopup}>
        <Box sx={popupStyle}>
          <Typography variant="h6" component="h2" gutterBottom>
            {statusPopupMessage}
          </Typography>
        </Box>
      </Modal>
      <Grid
        container
        spacing={2}
        style={{ marginLeft: 20, marginRight: "auto", display: "flex", justifyContent: "space-between" }}
      >
        {/* <Grid item xs={3}>
          <Card
            sx={{
              width: 400,
              height: 200,
              borderRadius: 5,
              boxShadow: 5,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Max Available CPU
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: "#3f51b5", fontWeight: "bold" }}
              >
                {cpuProgress}%
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              width: 400,
              height: 200,
              borderRadius: 5,
              boxShadow: 5,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Max Available Memory
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: "#4caf50", fontWeight: "bold" }}
              >
                {memoryProgress.toFixed(0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid> */}

        {/* Stack 1: Max Available CPU & Memory */}
        {/* Stack 1: Max Available CPU & Memory */}
        <Grid item xs={1.2} sx={{ marginTop: "120px" }} >
          <Card sx={{ width: 120, height: 120, borderRadius: 5, boxShadow: 5, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>Max Available CPU</Typography>
              <Typography variant="h4" sx={{ color: "#3f51b5", fontWeight: "bold" }}>{cpuProgress}%</Typography>
            </CardContent>
          </Card>



          <Card sx={{ width: 120, height: 120, borderRadius: 5, boxShadow: 5, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>Max Available Memory</Typography>
              <Typography variant="h4" sx={{ color: "#4caf50", fontWeight: "bold" }}>{memoryProgress.toFixed(0)}%</Typography>
            </CardContent>
          </Card>
        </Grid>



        {/* Stack 2: ASIL CPU & Memory Usage */}
        <Grid item xs={1.2} sx={{ marginTop: "120px" }}>
          <Card sx={{ width: 120, height: 120, borderRadius: 5, boxShadow: 5, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>ASIL CPU Usage</Typography>
              <Typography variant="h4" sx={{ color: "#ff9800", fontWeight: "bold" }}>{asilCpuProgress}%</Typography>
            </CardContent>
          </Card>



          <Card sx={{ width: 120, height: 120, borderRadius: 5, boxShadow: 5, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>ASIL Memory Usage</Typography>
              <Typography variant="h4" sx={{ color: "#ff5722", fontWeight: "bold" }}>{asilMemoryProgress.toFixed(0)}%</Typography>
            </CardContent>
          </Card>
        </Grid>



        {/* Stack 3: QM CPU & Memory Usage */}
        <Grid item xs={1.2} sx={{ marginTop: "120px" }}>
          <Card sx={{ width: 120, height: 120, borderRadius: 5, boxShadow: 5, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>QM CPU Usage</Typography>
              <Typography variant="h4" sx={{ color: "#673ab7", fontWeight: "bold" }}>{qmCpuProgress}%</Typography>
            </CardContent>
          </Card>



          <Card sx={{ width: 120, height: 120, borderRadius: 5, boxShadow: 5, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>QM Memory Usage</Typography>
              <Typography variant="h4" sx={{ color: "#009688", fontWeight: "bold" }}>{qmMemoryProgress.toFixed(0)}%</Typography>
            </CardContent>
          </Card>
        </Grid>



        {/* Stack 4: Available QM CPU & Memory Usage */}
        <Grid item xs={1.2} sx={{ marginTop: "120px" }}>
          <Card sx={{ width: 120, height: 120, borderRadius: 5, boxShadow: 5, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>Available QM CPU</Typography>
              <Typography variant="h4" sx={{ color: "#673ab7", fontWeight: "bold" }}>{qmAvailableCpuProgress}%</Typography>
            </CardContent>
          </Card>



          <Card sx={{ width: 120, height: 120, borderRadius: 5, boxShadow: 5, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "20px" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>Available QM Memory</Typography>
              <Typography variant="h4" sx={{ color: "#009688", fontWeight: "bold" }}>{qmAvailableMemoryProgress.toFixed(0)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* (Speed Card) */}
        <Grid item xs={3} container justifyContent="center" alignItems="center">
          <Card
            sx={{
              width: 250,
              height: 300,
              borderRadius: 4,
              boxShadow: 5,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              marginBottom: "20px",
              backgroundColor: "#020202",
              color: "white",
            }}
          >
            <Speedometer speed={speed} vehicleState={vehicleState} />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Speed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={4}>
          {/* Car Icon Card */}
          <Card
            sx={{
              width: 300,
              height: 200,
              borderRadius: 5,
              boxShadow: 5,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <img
              src="/car_icon.png"
              alt="car_image"
              style={{ width: "200px", height: "200px" }}
            />
          </Card>

          <Card
            sx={{
              width: 300,
              height: 300,
              borderRadius: 5,
              boxShadow: 5,
              padding: "20px",
            }}
          >
            <CardContent>
              <Typography variant="h5" gutterBottom>
                ASIL Apps
              </Typography>

              <Typography variant="h6" textAlign="left">
                <h5>ACC</h5>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={selectedACC}
                    onChange={handleACCChange}
                  >
                    <FormControlLabel
                      value="play"
                      control={<Radio disabled={isDisabled} />}
                      label="Play"
                    />
                    <FormControlLabel
                      value="stop"
                      control={<Radio disabled={isDisabled} />}
                      label="Stop"
                    // disabled={selectedACC === "accPlay"}
                    />
                  </RadioGroup>
                </FormControl>
              </Typography>

              <Typography variant="h6" textAlign="left" mt={2}>
                <h5>Lane Assist</h5>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={selectedLaneAssist}
                    onChange={handleLaneAssistChange}
                  >
                    <FormControlLabel
                      value="play"
                      control={<Radio disabled={isDisabled} />}
                      label="Play"
                    />
                    <FormControlLabel
                      value="stop"
                      control={<Radio disabled={isDisabled} />}
                      label="Stop"
                    // disabled={selectedLaneAssist === "laneAssistPlay"}
                    />
                  </RadioGroup>
                </FormControl>
              </Typography>
            </CardContent>

          </Card>
        </Grid>
      </Grid>
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "60px",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          sx={{
            width: 120,
            height: 50,
            backgroundColor: activeButton === "drive" ? "#80c080" : "green",
            "&:hover": {
              backgroundColor: activeButton === "drive" ? "#80c080" : "#007d00",
            },
          }}
          onClick={handleDriveClick}
          disabled={activeButton === "drive"}
        >
          Drive
        </Button>
        <Button
          variant="contained"
          color="secondary"
          sx={{
            width: 120,
            height: 50,
            backgroundColor: activeButton === "park" ? "#e08080" : "red",
            "&:hover": {
              backgroundColor: activeButton === "park" ? "#e08080" : "#b30000",
            },
          }}
          onClick={handleParkClick}
          disabled={activeButton === "park"}
        >
          Park
        </Button>
        <Button
          variant="contained"
          color="secondary"
          sx={{
            width: 120,
            height: 50,
            fontSize: 12,
            color: "black",
            backgroundColor: activeButton === "reverse" ? "#FFB84D" : "#FFA500",
            "&:hover": {
              backgroundColor:
                activeButton === "reverse" ? "#FFFFFF" : "#FFFFFF",
            },
          }}
          onClick={handleReverseViewClick}
          disabled={activeButton === "reverse"}
        >
          Reverse
        </Button>
      </div>
    </div>
  );
}

export default App;
