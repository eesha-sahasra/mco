import { Card, Button, Modal, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SettingsIcon from '@mui/icons-material/Settings';
import StoreIcon from '@mui/icons-material/Store';
import WeatherApp from "./WeatherApp";
import { useState, useRef } from "react";
import { BROWSER_TAB_URL, OEM_SERVER_URL, SERVER_URL } from "../config";
import axios from 'axios';
import VersionUpdateModal from '../utils/VersionUpdateModal';

const Home = () => {
    const VIN = "066139B3C96B";
    let browserTabUrl = `${BROWSER_TAB_URL}`;
    const url = `${SERVER_URL}/launchNavigation`;
    const version_check_url = `${OEM_SERVER_URL}/navigation_version`;
    const getVehicleInfoUrl = `${SERVER_URL}/getVehicleInfo`;
    const setActionUrl = `${SERVER_URL}/setAction`;
    const checkQmValueUrl = `${SERVER_URL}/getQmRunningNavigationApp`;
    const clearLackOfResourceUrl = `${SERVER_URL}/clear_lack_of_resources`;
    const navigate = useNavigate();
    const [carImage, setCarImage] = useState("/assets/lexus.png");
    const [btnText, setBtnText] = useState('Open Navigation');
    const [showVersionPopup, setShowVersionPopup] = useState(false);
    const [versionPopupMessage, setVersionPopupMessage] = useState("");
    const [recommendedNavigationApp, setRecommendedNavigationApp] = useState([]);
    const [playingNavigationApp, setPlayingNavigationApp] = useState([]);
    const [stoppedNavigationApp, setStoppedNavigationApp] = useState([]);
    const [selectedDownloadNavigationApp, setSelectedDownloadNavigationApp] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [statusPopupMessage, setStatusPopupMessage] = useState('');
    const newAvailableVersion = useRef("");
    const [windows, setWindows] = useState({
        "map": [],
    });

    const popupStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: '10px',
    };

    const currentDownloadedNavigationList = [];
    const openWindow = (app, url) => {
        console.log('app opened', app)
        const newWindow = window.open(url, "_blank");
        setWindows(prevWindows => ({
            ...prevWindows,
            [app]: [...prevWindows[app], newWindow],
        }));
        console.log('windows', windows);
    };

    const closeWindows = (app) => {
        console.log('closed window', app);
        setWindows(prevWindows => {
            prevWindows[app].forEach(win => {
                if (win) win.close();
            });
            return {
                ...prevWindows,
                [app]: [],
            };
        });
    };

    const pollNavigationAppRunningStatus = async (appName) => {
        try {
            const response = await axios.get(checkQmValueUrl);
            console.log("qm_info_navigation_running_apps status:", response.data);

            // Check if the appName exists in the returned list
            const runningNavigationAppList = response.data.qm_info_navigation_running_apps || [];
            const lackOfResources = response.data.lack_of_resources || {};
            const lackOfResourcesGame = response.data.lack_of_resources.app || "";
            const insufficientResources = lackOfResources.insufficient_resources || [];

            // Check if resources are insufficient
            if (lackOfResourcesGame === appName) {
                const resourcesText = insufficientResources.length > 0
                    ? `(${insufficientResources.join(", ")})`
                    : "";
                setShowPopup(true);
                setPopupMessage(`Insufficient resources ${resourcesText} to launch the app!`);
                console.error("Resources are insufficient for", appName);
                //clear the lack_of_resources key after reading it
                axios.post(clearLackOfResourceUrl)
                    .then(response => console.log("Cleared Redis key:", response.data))
                    .catch(error => console.error("Error clearing Redis key:", error));
                return false; // Stop polling
            }

            if (!runningNavigationAppList.includes(appName)) {
                setShowStatusPopup(true);
                setStatusPopupMessage("Initialization in progress...");
                // Continue polling every 2 seconds until the game is detected
                await new Promise(resolve => setTimeout(resolve, 2000));
                return pollNavigationAppRunningStatus(appName);
            } else {
                // Game is now running, return success
                setShowStatusPopup(false);
                console.log(`${appName} is now running!`);
                return true;
            }
        } catch (error) {
            console.error("Error polling qm_info_navigation_running_apps:", error);
            return false;
        }
    };

    const startNavigationApp = async (app) => {
        try {
            await axios.post(setActionUrl, { navigationName: app });

            const isNavigationAppRunning = await pollNavigationAppRunningStatus(app);
            console.log("isNavigationAppRunning:", isNavigationAppRunning);

            if (!isNavigationAppRunning) {
                console.error("Navigation App is not running, stopping execution.");
                return;
            }

            // Now, proceed with starting the app
            const payload = { "navigationName": app };
            const loadDownloadNavigationResponse = await axios.post(url, payload);
            console.log("loadDownloadNavigationResponse", loadDownloadNavigationResponse);

            if (loadDownloadNavigationResponse.status !== 200) {
                throw new Error("Failed to start navigation app");
            }

            const navigationAppData = loadDownloadNavigationResponse.data;

            setPlayingNavigationApp((prevPlayingNavigationApp) => {
                const navigationAppDetails = navigationAppData[app];
                const isAlreadyPlaying = prevPlayingNavigationApp.some((navObj) => Object.keys(navObj)[0] === app);
                return isAlreadyPlaying ? prevPlayingNavigationApp : [...prevPlayingNavigationApp, { [app]: navigationAppDetails }];
            });

            let navigationUrl = browserTabUrl;
            if (app === 'map') navigationUrl += ":8085/";

            console.log('Opening URL:', navigationUrl);
            openWindow(app, navigationUrl);

            // if (!isPollingActiveRef.current) {
            //     pollGameStatus();
            // }
            // if (!isPollingRef.current) {
            //     isStoppingGameRef.current = false;
            //     pollGameStoppingStatus(game);
            // }

        }
        catch (err) {
            console.error("Error starting the game:", err);
        }
    };

    const handleNavigationClick = async () => {
        let fetchedVersion = null;

        try {
            // Version check for update
            const versionResponse = await axios.post(version_check_url, { navigationName: "map" });
            fetchedVersion = versionResponse.data.version;
            console.log('Fetched version for map:', fetchedVersion);
        } catch (error) {
            console.error("Version check failed:", error);
            // Continue execution even if this API fails
        }

        try {
            // const downloadedNavigation = currentDownloadedNavigationList.find(navObj => Object.keys(navObj)[0] === "map");

            // if (!downloadedNavigation) {
            //     console.log("Map not found in downloaded navigation apps list.");
            //     return;
            // }

            // const localVersion = downloadedNavigation["map"].find(item => item.version)?.version;

            // console.log(`Local version for map:`, localVersion);

            // // If version check was successful and versions differ, show update popup
            // if (fetchedVersion && fetchedVersion !== localVersion) {
            //     newAvailableVersion.current = fetchedVersion;
            //     setSelectedDownloadNavigationApp("map");
            //     setVersionPopupMessage(`Version update for map is available.`);
            //     setShowVersionPopup(true);
            //     return;
            // }

            //Navigation app launch only when drive mode is enabled
            const vehicleInfoResponse = await axios.get(getVehicleInfoUrl);
            const vehicleInfo = vehicleInfoResponse.data;
            console.log('test')
            if (vehicleInfo.vehicle_state !== "park") {
                await startNavigationApp("map");
            } else {
                setPopupMessage('Vehicle is in park mode. Turn on the drive mode to open navigation');
                setShowPopup(true);
            }
        } catch (error) {
            console.error("Error while launching navigation app:", error);
        }

        // window.open('https://www.google.com/maps', '_blank');
        // setBtnText('Close Navigation');
        // document.getElementById('myButton').style.display = 'none';
        // document.getElementById('nav').style.opacity = 1;
    };

    const handleCancelClick = () => {
        setShowPopup(false);
        setShowStatusPopup(false);
    };

    return (
        <div style={{ width: '100%', minHeight: '100vh', padding: 20, position: 'relative' }}>
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
            <VersionUpdateModal
                open={showVersionPopup}
                onContinue={() => {
                    setShowVersionPopup(false);
                    // handleGameUpdateTrigger(selectedDownloadGame); // Continue with the game launch
                }}
                onIgnore={() => {
                    setShowVersionPopup(false);
                    // startNavigationApp(selectedDownloadGame); // Start game without checking version
                }}
                message={versionPopupMessage}
            />
            <Modal open={showStatusPopup}>
                            <Box sx={popupStyle}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {statusPopupMessage}
                                </Typography>
                            </Box>
                        </Modal>
            <div style={{ width: '98%', height: '75vh', display: 'flex', justifyContent: 'space-evenly' }}>
                <div style={{
                    width: '45%', height: '95%', marginTop: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    // border:'1px solid red', 
                }}>
                    <div style={{
                        width: '100%', height: '75%',
                        // border:'1px solid green' 
                    }}>
                        <img
                            src={carImage}
                            alt="map"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: '10px',
                            }} />
                    </div>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-evenly",
                        height: '25%',
                        boxSizing: 'border-box',
                    }}>
                        {/* First Button */}
                        <Button
                            variant="contained"
                            sx={{
                                width: 100,
                                height: 80,
                                borderRadius: 2, // Square shape (can tweak for rounded edges)
                                backgroundColor: '#333',
                                // boxShadow: "0 4px 8px rgba(128, 128, 128, 0.3)", // Mild grey shadow
                                '&:hover': {
                                    backgroundColor: '#333',
                                },
                                fontWeight: 'bold',
                            }}
                            onClick={() => setCarImage("/assets/lexus.png")}
                        >
                            Normal
                        </Button>

                        {/* Second Button */}
                        <Button
                            variant="contained"
                            sx={{
                                width: 100,
                                height: 80,
                                borderRadius: 2,
                                backgroundColor: '#333',
                                // boxShadow: "0 4px 8px rgba(128, 128, 128, 0.3)",
                                '&:hover': {
                                    backgroundColor: '#333',
                                },
                                fontWeight: 'bold',
                            }}
                            onClick={() => setCarImage("/assets/lexus_eco.png")}
                        >
                            Eco
                        </Button>

                        {/* Third Button */}
                        <Button
                            variant="contained"
                            sx={{
                                width: 100,
                                height: 80,
                                borderRadius: 2,
                                backgroundColor: '#333',
                                // boxShadow: "0 4px 8px rgba(128, 128, 128, 0.3)",
                                '&:hover': {
                                    backgroundColor: '#333',
                                },
                                fontWeight: 'bold',
                            }}
                            onClick={() => setCarImage("/assets/lexus_sport.png")}
                        >
                            Sport
                        </Button>
                    </div>
                </div>
                <div style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
                    <div style={{ width: '100%', height: '45%' }}>
                        <Card
                            sx={{
                                width: '100%',
                                height: '100%',
                                boxShadow: "0 4px 8px rgba(128, 128, 128, 0.7)",
                                borderRadius: "10px",
                                border: '2px solid #1f2124',
                                backgroundColor: '#1f2124',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <img
                                    id="nav"
                                    src="/assets/map2.png"
                                    alt="map"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '10px',
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.opacity = 0.5;
                                        document.getElementById('myButton').style.display = 'block';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.opacity = 1
                                        document.getElementById('myButton').style.display = 'none';
                                    }}
                                />
                                <Button
                                    id="myButton"
                                    onClick={handleNavigationClick}
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        padding: '10px 20px',
                                        backgroundColor: 'black',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        display: 'none'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.display = 'block';
                                        document.getElementById("nav").style.opacity = 0.5
                                    }}
                                >
                                    {btnText}
                                </Button>
                            </div>

                        </Card>
                    </div>
                    <div style={{ width: '100%', height: '37%', marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                        <Card
                            sx={{
                                width: '49%',
                                height: '100%',
                                boxShadow: "0 4px 8px rgba(128, 128, 128, 0.7)",
                                borderRadius: "10px",
                                border: '2px solid rgb(55,48,64)',
                                backgroundColor: 'rgb(55,48,64)',
                                cursor: 'pointer',
                            }}
                            onClick={() => { navigate("/music") }}
                        >
                            <img
                                src="/assets/music.png"
                                alt="map"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '10px',
                                    border: '1px solid #1f2124',
                                }}
                            />
                        </Card>
                        <Card
                            sx={{
                                width: '49%',
                                height: '100%',
                                boxShadow: "0 4px 8px rgba(128, 128, 128, 0.7)",
                                borderRadius: "10px",
                                backgroundColor: '#1f2124',
                            }}
                        >
                            <WeatherApp />
                        </Card>
                    </div>
                </div>
            </div>
            <div style={{
                width: '98%', height: '15vh', display: 'flex',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                padding: '10px',
            }}>
                <Button
                    sx={{
                        backgroundColor: '#1f2124',
                        boxShadow: '0 4px 8px rgba(128, 128, 128, 0.7)',
                        borderRadius: '50%',
                        width: 75,
                        height: 75,
                        '&:hover': {
                            backgroundColor: '#333',
                        },
                    }}
                >
                    <SettingsIcon sx={{ color: '#fff', fontSize: 38 }} />
                </Button>

                <Button
                    onClick={() => navigate('/appStore')}
                    sx={{
                        backgroundColor: '#1f2124',
                        boxShadow: '0 4px 8px rgba(128, 128, 128, 0.7)',
                        borderRadius: '50%',
                        width: 75,
                        height: 75,
                        '&:hover': {
                            backgroundColor: '#333',
                        },
                    }}
                >
                    <StoreIcon sx={{ color: '#fff', fontSize: 38 }} />
                </Button>
            </div>
        </div>
    );
};

export default Home;