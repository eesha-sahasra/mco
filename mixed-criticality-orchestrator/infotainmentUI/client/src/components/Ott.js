import { Typography, Paper, Box, Tooltip, Modal, Button } from "@mui/material";
import { OTT_SERVER_URL,  BROWSER_TAB_URL} from "../config";
import axios from "axios";
import { useState, useRef, useEffect } from "react";

const OttFeature = () => {
  const VIN = "066139B3C96B";
  const setActionUrl = `${OTT_SERVER_URL}/setAction`;
  const setStopActionUrl = `${OTT_SERVER_URL}/setStopAction`;
  const checkOttQmValueUrl = `${OTT_SERVER_URL}/getQmRunningOtt`;
  const checkOttQmStopvalueUrl = `${OTT_SERVER_URL}/getQmStoppedOtt`;
  const clearLackOfResourceUrl = `${OTT_SERVER_URL}/clear_lack_of_resources`;
  const moveOttFromRecToRunningUrl = `${OTT_SERVER_URL}/moveOttFromRecToRunning`;
  const moveOttFromRunningToStoppedUrl = `${OTT_SERVER_URL}/moveOttFromRunningToStopped`;
  const checkForRunningAppInfoKeyUrl = `${OTT_SERVER_URL}/checkOttInRunningArray`;
  const clearOttQmValueUrl = `${OTT_SERVER_URL}/clearOttQmStopValue`;
  let browserTabUrl = `${BROWSER_TAB_URL}`;
  // http://172.31.45.221:6013/video_feed
  const [statusPopupMessage, setStatusPopupMessage] = useState("");
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  //lack of resources pop up
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  //Variable for priority deletion polling check
  const isPollingActiveRef = useRef(false);
  const isStoppingOttRef = useRef(false);
  const [runningOtts, setRunningOtts] = useState([]);
  const [stoppingOtts, setStoppingOtts] = useState([]);

  // useEffect(() => {}, [runningOtts]);

  useEffect(() => {
    loadOttApps();
}, []);

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

  //State variable for multi-tab opening for game launch
      const [windows, setWindows] = useState({
          netflix: [],
          prime:[],
          aha:[],
        });

  const loadOttApps = async () => {
    const url = `${OTT_SERVER_URL}/getOtts`;

    const payload = {
        "vin": VIN,
    };

    try {
        const loadOttResponse = await axios.post(url, payload);
        const ottData = loadOttResponse.data;
        console.log('loadOttResponse data', ottData);

        if (ottData) {
            // setDownloadedGames(gamesData.games.downloaded);
            // setRecommendedGames(gamesData.games.recommended);
            setRunningOtts(ottData.ott.running);
            // setStoppedGames(gamesData.games.stopped);
        } else {
            console.error("No data exists for ott apps")
        }
    }
    catch (err) {
        console.error('Error in loading the ott apps', err);
    }
};

// const openWindow = (ottApp, url) => {
//   console.log('ottApp opened', ottApp)
//   const newWindow = window.open(url, "_blank");
//   setWindows(prevWindows => ({
//     ...prevWindows,
//     [ottApp]: [...prevWindows[ottApp], newWindow],
//   }));
//   console.log('windows', windows);
// };

// const closeWindows = (ottApp) => {
//   console.log('closed window', ottApp);
//   setWindows(prevWindows => {
//       prevWindows[ottApp].forEach(win => {
//           if (win) win.close();
//       });
//       return {
//           ...prevWindows,
//           [ottApp]: [],
//       };
//   });
// };

const openWindow = async (ottApp, url) => {
  console.log('ottApp opened', ottApp);
  
  // Wait for container to be ready
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Create and configure new window
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Netflix</title>
          <style>
            body { 
              margin: 0; 
              background: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            video {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <video id="videoPlayer" controls autoplay>
            <source src="${url}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <script>
            // Retry loading if video fails
            const video = document.getElementById('videoPlayer');
            video.onerror = () => {
              setTimeout(() => {
                video.load();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
  }

  setWindows(prevWindows => ({
    ...prevWindows,
    [ottApp]: [...prevWindows[ottApp], newWindow],
  }));
};

const closeWindows = (ottApp) => {
  console.log('closed window', ottApp);
  setWindows(prevWindows => {
    prevWindows[ottApp].forEach(win => {
      if (win) win.close();
    });
    return {
      ...prevWindows,
      [ottApp]: [],
    };
  });
};

  const pollOttAppRunningStatus = async (ottName) => {
    try {
      const response = await axios.get(checkOttQmValueUrl);
      console.log("qm_info_ott_running_apps status", response.data);

      //check Ott app exists in the returned list
      const runningOttAppsList = response.data.qm_info_ott_running_apps || [];
      const lackOfResources = response.data.lack_of_resources || {};
      const lackOfResourcesOtt =
        response.data.lack_of_resources.app || "";
      const insufficientResources =
        lackOfResources.insufficient_resources || [];
      console.log("lackOfResourcesOtt", lackOfResourcesOtt);
      if (lackOfResourcesOtt === ottName) {
        const resourceText =
          insufficientResources.length > 0
            ? `${insufficientResources.join(",")}`
            : "";
        setShowPopup(true);
        setPopupMessage(
          `Insufficient resources ${resourceText} to launch the OTT app!`
        );
        console.error("Resources are insufficient for", ottName);
        //clear the lack of resources key after reading it
        axios
          .post(clearLackOfResourceUrl)
          .then((response) =>
            console.log("Cleared Redis key : ", response.data)
          )
          .catch((error) => console.error("Error clearing Redis key:", error));
        return false; //stop polling
      }

      if (!runningOttAppsList.includes(ottName)) {
        setShowStatusPopup(true);
        setStatusPopupMessage("Initialization in progress...");
        //continue polling for every 2 seconds until the game is deteted
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return pollOttAppRunningStatus(ottName);
      } else {
        //Ott app is now running , return success
        setShowStatusPopup(false);
        console.log(`${ottName}is now playing`);
        return true;
      }
    } catch (error) {
      console.error("Error polling qm_info_ott_running_apps:", error);
      return false;
    }
  };

  const moveOttFromRunningToStopped = async (stoppedOtt) => {
    try {
        if (!stoppedOtt.length) {
            console.log("No stopped OTT apps to process.");
            return;
        }

        const payload = { ottName: stoppedOtt };

        const response = await axios.post(moveOttFromRunningToStoppedUrl, payload);

        if (response.status === 200) {
            console.log("OTT apps moved successfully:", response.data);
        } else {
            console.log("No OTT apps moved from infotainment.");
        }
        return response;
    } catch (error) {
        console.error("Error checking/moving OTT apps in infotainment:", error);
    }
};

  const pollOttAppStoppingStatus = async (ottName) => {
    //prevent multiple polling instances
    isPollingActiveRef.current = true;
    try {
      const response = await axios.get(checkOttQmStopvalueUrl);
      console.log(
        "qm_info_ott_stopped_apps status",
        response.data.qm_info_ott_stopped_apps
      );
      // check if game exists in the given List
      const stoppedOttAppsList = response.data.qm_info_ott_stopped_apps || [];
      // setStoppingOtts(stoppedOttAppsList);

      if (!stoppedOttAppsList.includes(ottName)) {
        console.log("isPollingActiveRef",isPollingActiveRef.cu)
        if (isPollingActiveRef.current) {
          setShowStatusPopup(true);
          setStatusPopupMessage("Termination of OTT app is in progress...");
        }
        // continue polling for every 2 seconds until the game is detected
        setTimeout(() => pollOttAppStoppingStatus(ottName), 2000);
      } else {
        // move ott from running to stopped
        console.log('stopping ott app.........')
        await moveOttFromRunningToStopped(stoppedOttAppsList);
        await axios.post(clearOttQmValueUrl);
        await loadOttApps();
        closeWindows(ottName);
        setShowStatusPopup(false);
        isPollingActiveRef.current = false;
        isStoppingOttRef.current = false;
        // return true;
      }
    } catch (error) {
      console.error("Error polling qm_info_ott_stopped_apps:", error);
      isPollingActiveRef.current = false; // Reset polling flag on error
    }
  };

  const handleStopOttApp = async (ott) => {
    //call pollOttAppStoppingStatus()
    try {
      // update info_selectio key when user manually stops the ott app with action "stop"
      await axios.post(setStopActionUrl, { ottName: ott });

      setShowStatusPopup(true);
      setStatusPopupMessage("Termination of ott app is in progress...");
      
      // Start polling for stop status
      if (!isPollingActiveRef.current) {
        const isOttAppStopped = await pollOttAppStoppingStatus(ott);
        if (!isOttAppStopped) {
          console.log("OTT app is not stopped,stopping execution.");
          return;
        }
    };
      
      
    } catch (error) {
      console.error("Error stopping OTT app:", error);
    }
  };

  const pollForOttAppRunningArray = async (ottName) => {
    try {
      //make an api call to check for the running [] has ottName or not
      const response = await axios.post(checkForRunningAppInfoKeyUrl, {
        ottName: ottName,
      });
      if (response.status === 200) {
        setRunningOtts((prev) => [...prev, ottName]);
        console.log("Found Ott app in running array---> ", response.data);
        return true;
      }
      //continue polling for every 2 seconds until the game is detected
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return pollForOttAppRunningArray(ottName);
    } catch (error) {
      console.error("Error polling infotainment key for runnning apps:", error);
      return false;
    }
  };

//   const openWindow = (game, url) => {
//     console.log('game opened', game)
//     const newWindow = window.open(url, "_blank");
//     setWindows(prevWindows => ({
//       ...prevWindows,
//       [game]: [...prevWindows[game], newWindow],
//     }));
//     console.log('windows', windows);
//   };

//   const closeWindows = (game) => {
//     console.log('closed window', game);
//     setWindows(prevWindows => {
//         prevWindows[game].forEach(win => {
//             if (win) win.close();
//         });
//         return {
//             ...prevWindows,
//             [game]: [],
//         };
//     });
// };

  const pollOttAppStatus = async () => {
    if (isPollingActiveRef.current) return;
        isPollingActiveRef.current = true;
      
        const pollInterval = setInterval(async () => {
          try {
              // Fetch the list of running ott apps
              const runningResponse = await axios.get(checkOttQmValueUrl);
              const runningOttApps = runningResponse.data.qm_info_ott_running_apps;

              // Fetch stopped ott apps
              const stoppingResponse = await axios.get(checkOttQmStopvalueUrl);
              console.log("qm_info_ott_stopped_apps status:", stoppingResponse.data.qm_info_ott_stopped_apps);

              // Check if the gameName exists in the returned list
              const stoppedOttApps = stoppingResponse.data.qm_info_ott_stopped_apps || [];

              if (!runningOttApps || runningOttApps.length === 0) {
                  console.log("No ott apps running. Stopping polling...");
                  clearInterval(pollInterval);
                  isPollingActiveRef.current = false;

                  await moveOttFromRunningToStopped(stoppedOttApps);
                  await axios.post(clearOttQmValueUrl);
                  await loadOttApps();
                  setShowStatusPopup(false);
                  closeWindows('netflix');
                  closeWindows('prime');
                  closeWindows('aha');
                  return;
              }


              if (stoppedOttApps && stoppedOttApps.length > 0) {
                  let movedOttApp = false; // Flag to track if at least one app was moved
                  for (const game of stoppedOttApps) {
                      if (["netflix", "prime", "aha"].includes(game)) {
                          // Check if game is still in running before making the API call
                          // if (!runningGames.includes(game)) continue; 

                          console.log(`Moving ${game} from running to stopped.`);
                          const payload = {
                              "gameName": game,
                          };
                          const stopGameResponse = await moveOttFromRunningToStopped(game);
                          console.log('stopGameResponse', stopGameResponse);

                          if (stopGameResponse.status === 200) {
                              movedOttApp = true;
                              await loadOttApps();
                              closeWindows(game);
                              setShowStatusPopup(false);
                          } else if (stopGameResponse.status === 404) {
                              console.log('Ott app not found in running')
                          }
                          else {
                              throw new Error("Failed to move the ott app from running to stopped");
                          }
                      }
                  }
                  // Call loadGames() if at least one game was moved
                  // if (movedOttApp) {
                  //     await loadGames();
                  // }
              }
              console.log('Polling continued for stopped app');
          } catch (error) {
              console.error("Error polling game status:", error);
          }
      }, 2000);
  }

  const startOttApp = async (ott) => {
    try {
      console.log(`Clicked on ${ott} item `);
      await axios.post(setActionUrl, { ottName: ott });
      const isOttAppRunning = await pollOttAppRunningStatus(ott);
      if (!isOttAppRunning) {
        console.log("OTT app is not playing,stopping execution.");
        return;
      }
      const payload = { ottName: ott };
      // move Ott from recommended to running(e.g.,netflix)
      const loadRunningOttResponse = await axios.post(
        moveOttFromRecToRunningUrl,
        payload
      );
      if (loadRunningOttResponse.status !== 200) {
        throw new Error("Failed to start ott app!");
      }
      const ottData = loadRunningOttResponse.data;
      setRunningOtts((prevPlayingOtts) => {
        const ottDetails = ottData[ott];
        console.log("Ott details --------> ", ottDetails);
        const isAlreadyPlaying = prevPlayingOtts.some(
          (ottObj) => Object.keys(ottObj)[0] === ott
        );
        console.log("isAlreadyPlaying", isAlreadyPlaying);
        return isAlreadyPlaying
          ? prevPlayingOtts
          : [...prevPlayingOtts, { [ott]: ottDetails }];
      });

      //Now , proceed with the starting the Ott
      let ottAppUrl=browserTabUrl;
      if (ott === "netflix") ottAppUrl += ":6013/video_feed";
      if (ott === "prime") ottAppUrl += ":0000/";
      if (ott === "aha") ottAppUrl += ":0000/";

      openWindow(ott,ottAppUrl);

      if (!isPollingActiveRef.current) {
        pollOttAppStatus();
    }
      // move Ott from recommended to running
      // await axios.post(moveOttFromRecToRunningUrl, payload);
      // poll the ott running apps
      // const isOttAppRunningArray = await pollForOttAppRunningArray(ott);
      // if (!isOttAppRunningArray) {
      //   console.log("OTT app is not playing,stopping execution.");
      //   return;
      // }
      // console.log("isOttAppRunningArray:", isOttAppRunningArray);
    } catch (error) {
      console.error("Error in starting Ott app:", error);
    }
  };
  const handleCancelClick = () => {
    setShowPopup(false);
    setShowStatusPopup(false);
  };

  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",
      }}
    >
      <Typography variant="h5" style={{ color: "white", fontWeight: "bold" }}>
        OTT
      </Typography>
      <Modal open={showPopup} onClose={handleCancelClick}>
        <Box sx={popupStyle}>
          <Typography variant="h6" component="h2" gutterBottom>
            {popupMessage}
          </Typography>
          {
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCancelClick}
              >
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
      <Box
        sx={{
          display: "flex",
          padding: -1,
          marginTop: 6,
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          "&>:not(style)": { m: 5, width: 350, height: 350 },
        }}
      >
        <Tooltip title="Netflix">
          <Paper
            elevation={3}
            onClick={() => startOttApp("netflix")}
            sx={{
              cursor: "pointer",
              backgroundColor: "black",
              borderRadius: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              transition: "transform 0.3s ease-in-out",
              "&:hover": { transform: "scale(1.05)" },
            }}
          >
            <img src="/assets/netflix.png" alt="netflix_logo" />
            {runningOtts.some(
              (ottObj) => Object.keys(ottObj)[0] === "netflix"
            ) && (
              <Button
                variant="contained"
                color="error"
                sx={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80%",
                  backgroundColor: "red",
                  "&:hover": { backgroundColor: "darkred" },
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleStopOttApp("netflix");
                }}
              >
                Stop App
              </Button>
            )}
          </Paper>
        </Tooltip>
        <Tooltip title="Amazon Prime">
          <Paper
            elevation={3}
            onClick={() => startOttApp("prime")}
            sx={{
              cursor: "pointer",
              backgroundColor: "#0779ff",
              borderRadius: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              transition: "transform 0.3s ease-in-out", // Smooth transition
              "&:hover": {
                transform: "scale(1.05)", // Enlarge on hover
              },
            }}
          >
            <img src="/assets/prime.png" alt="prime_logo" />
            {runningOtts.some(
              (ottObj) => Object.keys(ottObj)[0] === "prime"
            ) && (
              <Button
                variant="contained"
                color="error"
                sx={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80%",
                  backgroundColor: "red",
                  "&:hover": { backgroundColor: "darkred" },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopOttApp("prime");
                }}
              >
                Stop App
              </Button>
            )}
          </Paper>
        </Tooltip>

        <Tooltip title="Aha">
          <Paper
            elevation={3}
            onClick={() => {
              startOttApp("aha");
            }}
            sx={{
              cursor: "pointer",
              backgroundColor: "#f46b34",
              borderRadius: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              transition: "transform 0.3s ease-in-out", // Smooth transition
              "&:hover": {
                transform: "scale(1.05)", // Enlarge on hover
              },
            }}
          >
            <img src="/assets/aha.jpeg" alt="aha_logo" />
            {runningOtts.some((ottObj) => Object.keys(ottObj)[0] === "aha") && (
              <Button
                variant="contained"
                color="error"
                sx={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80%",
                  backgroundColor: "red",
                  "&:hover": { backgroundColor: "darkred" },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopOttApp("aha");
                }}
              >
                Stop App
              </Button>
            )}
          </Paper>
        </Tooltip>
      </Box>
    </div>
  );
};

export default OttFeature;
