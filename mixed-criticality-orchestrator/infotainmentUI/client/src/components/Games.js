import { Card, Typography, CardMedia, Grid, IconButton, Button, Modal, Box, CircularProgress } from '@mui/material';
import { useState, useEffect, version, useRef } from 'react';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
// import CancelIcon from "@mui/icons-material/Cancel";
import axios from 'axios';
import { SERVER_URL, BROWSER_TAB_URL, OEM_SERVER_URL } from '../config';
import VersionUpdateModal from '../utils/VersionUpdateModal';

const Games = () => {
    const VIN = "066139B3C96B";
    let browserTabUrl = `${BROWSER_TAB_URL}`;
    const url = `${SERVER_URL}/playGame`;
    const setActionUrl = `${SERVER_URL}/setAction`;
    const setStopActionUrl = `${SERVER_URL}/setStopAction`;
    const checkQmValueUrl = `${SERVER_URL}/getQmRunningGames`;
    const infoServerUpdateUrl = `${SERVER_URL}/gameVersionUpdate`;
    const clearLackOfResourceUrl = `${SERVER_URL}/clear_lack_of_resources`;
    const version_check_url = `${OEM_SERVER_URL}/game_version`;
    const otaUrl = `${OEM_SERVER_URL}/gameServer`;
    const checkQmStopValueUrl = `${SERVER_URL}/getQmStoppedGames`;
    const clearQmValueUrl = `${SERVER_URL}/clearQmStopValue`;
    const getVehicleInfoUrl = `${SERVER_URL}/getVehicleInfo`;


    const [downloadedGames, setDownloadedGames] = useState([]);
    const [recommendedGames, setRecommendedGames] = useState([]);
    const [playingGames, setPlayingGames] = useState([]);
    const [stoppedGames, setStoppedGames] = useState([]);
    // const manifestVersion = useRef('');
    // const [manifestVersion,setManifestVersion]=useState('');
    const [currentDownloadedPage, setCurrentDownloadedPage] = useState(0);
    const [currentRecommendedPage, setCurrentRecommendedPage] = useState(0);

    const [showPopup, setShowPopup] = useState(false);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [statusPopupMessage, setStatusPopupMessage] = useState('');
    const [gameName, setGameName] = useState('');

    const [globalGameResource, setGlobalGameResource] = useState(null);
    const [activeGame, setActiveGame] = useState(null);
    // const [wasPlaying, setWasPlaying] = useState(false);
    // const [gameLoading, setGameLoading] = useState({});

    const [showVersionPopup, setShowVersionPopup] = useState(false);
    const [versionPopupMessage, setVersionPopupMessage] = useState("");
    const [selectedDownloadGame, setSelectedDownloadGame] = useState("");
    const newAvailableVersion = useRef("");

    const isPollingRef = useRef(false);
    const isStoppingGameRef = useRef(false);  // Tracks if polling was triggered by stopGame

    //Variable for priority deletion polling check
    const isPollingActiveRef = useRef(false);

    //State variable for multi-tab opening for game launch
    const [windows, setWindows] = useState({
        astray: [],
        pacman: [],
        spaceinvaders: [],
      });

    const gamesPerPage = 3;

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

    useEffect(() => {
        loadGames();
    }, []);

    useEffect(() => {
        console.log("Updated playingGames:", playingGames);
    }, [playingGames]);

    const loadGames = async () => {
        const url = `${SERVER_URL}/getGames`;

        const payload = {
            "vin": VIN,
        };

        try {
            const loadGamesResponse = await axios.post(url, payload);
            const gamesData = loadGamesResponse.data;
            console.log('loadGamesResponse data', gamesData);

            if (gamesData) {
                setDownloadedGames(gamesData.games.downloaded);
                setRecommendedGames(gamesData.games.recommended);
                setPlayingGames(gamesData.games.running);
                setStoppedGames(gamesData.games.stopped);
            } else {
                console.error("No data exists for games")
            }
        }
        catch (err) {
            console.error('Error in loading the games', err);
        }
    };

    const openWindow = (game, url) => {
        console.log('game opened', game)
        const newWindow = window.open(url, "_blank");
        setWindows(prevWindows => ({
          ...prevWindows,
          [game]: [...prevWindows[game], newWindow],
        }));
        console.log('windows', windows);
      };

      const closeWindows = (game) => {
        console.log('closed window', game);
        setWindows(prevWindows => {
            prevWindows[game].forEach(win => {
                if (win) win.close();
            });
            return {
                ...prevWindows,
                [game]: [],
            };
        });
    };
    

    //Updates the games in server
    const updateGamesServer = async (payload) => {
        const url = `${SERVER_URL}/setGames`;
        try {
            const updateGamesResponse = await axios.post(url, payload);
            console.log('updateGamesResponse', updateGamesResponse);
            // setGameLoading((prevLoading) => ({ ...prevLoading, [gameName]: false }));
            // if (updateGamesResponse.status === 200) {
            //     setShowStatusPopup(false);
            //     setStatusPopupMessage("Downloading is completed!")
            // } else {
            //     alert(`Error: Received unexpected status code ${updateGamesResponse.status}`);
            // }
        }
        catch (err) {
            console.error("Error in updating games to the server", err);
        };

    };

    const getCurrentPageGames = (games, currentPage) => {
        const startIndex = currentPage * gamesPerPage;
        return games.slice(startIndex, startIndex + gamesPerPage);
    };

    const handleDownloadedPrev = () => {
        if (currentDownloadedPage > 0) {
            setCurrentDownloadedPage(currentDownloadedPage - 1);
        }
    };

    const handleDownloadedNext = () => {
        if ((currentDownloadedPage + 1) * gamesPerPage < downloadedGames.length) {
            setCurrentDownloadedPage(currentDownloadedPage + 1);
        }
    };

    const handleRecommendedPrev = () => {
        if (currentRecommendedPage > 0) {
            setCurrentRecommendedPage(currentRecommendedPage - 1);
        }
    };

    const handleRecommendedNext = () => {
        if ((currentRecommendedPage + 1) * gamesPerPage < recommendedGames.length) {
            setCurrentRecommendedPage(currentRecommendedPage + 1);
        }
    };

    const currentDownloadedGames = getCurrentPageGames(downloadedGames, currentDownloadedPage);
    console.log('currentDownloadedGames', currentDownloadedGames)
    const currentRecommendedGames = getCurrentPageGames(recommendedGames, currentRecommendedPage);


    const handleOkClick = async () => {
        console.log(`Game ${gameName} will be downloaded.`);

        const apiUrl = "http://127.0.0.1:5001/updateInfotainment";
        console.log("globalGameResource", globalGameResource)

        try {
            const response = await axios.post(apiUrl, globalGameResource, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('API response:', response.data);

            if (response.status === 200) {
                console.log('Infotainment updated successfully.');
                const selectedGame = currentRecommendedGames.filter((game) => game.name == gameName);
                console.log("selectedGame", selectedGame)
                // handleGameClick(selectedGame[0].imageUrl,selectedGame[0].name);
                // handleGameCardClick(gameName);
            }
        } catch (error) {
            console.error('Error updating infotainment:', error);
        }

        setShowPopup(false);
    };


    const handleCancelClick = () => {
        setShowPopup(false);
        setShowStatusPopup(false);
    };

    const handleResourceCheck = (freeResources, globalGameResource, game) => {
        const gameResources = globalGameResource.games[game];

        if (gameResources) {
            if (
                parseInt(freeResources.cpu) >= parseInt(gameResources.cpu) &&
                parseInt(freeResources.memory) >= parseInt(gameResources.memory)
            ) {
                setPopupMessage('Resources are available. Would you like to download the game?');
                setGameName(game);
                setShowPopup(true);
            } else {
                setPopupMessage('System resources are not sufficient to download the game.');
                setShowPopup(true);
            }
        } else {
            console.error(`Game resources not found for game: ${game}`);
            setPopupMessage(`Unable to find resource requirements for ${game}.`);
            setShowPopup(true);
        }
    };


    const handleDownloadedGameCardClick = async (game) => {
        console.log("Game name clicked:", game);

        const gameResourceUrl = "http://127.0.0.1:5001/gameResource";
        const freeResourceUrl = "http://127.0.0.1:5001/availableResources";

        const payload = { gameName: game };
        // let globalGameResource = null;

        try {

            const gameResourceResponse = await axios.post(gameResourceUrl, payload);

            if (gameResourceResponse.status === 200) {
                const receivedResource = gameResourceResponse.data;
                console.log("Game resource received:", receivedResource);

                if (receivedResource) {
                    setGlobalGameResource(receivedResource);

                    const freeResourceResponse = await axios.get(freeResourceUrl);
                    console.log("Free resources response:", freeResourceResponse.data);

                    const freeResources = JSON.parse(freeResourceResponse.data.data);
                    console.log("Parsed free resources:", freeResources);

                    handleResourceCheck(freeResources, receivedResource, game);
                } else {
                    console.error("Game resource is null or undefined.");
                }
            } else {
                console.error("Failed to fetch game resource, status:", gameResourceResponse.status);
            }
        } catch (error) {
            console.error("Error in handling game card click:", error);
        }
    };

    const handleOtaGameUpdate = async (selectedGame) => {
        console.log("selectedGame", selectedGame);
        const game = Object.keys(selectedGame)[0];
        const gameImage = selectedGame[game][2].imageUrl;

        const gameVersion = selectedGame[game][0].version;
        const gameCategory=selectedGame[game][1].category;
        const gameYamlPath = selectedGame[game][3].yaml_path;
        const gameResources=selectedGame[game][4].resources;
        const gamePriority=selectedGame[game][5].priority;
        console.log('After OTA selectedGame name', game)
        console.log('After OTA selectedGame gameImage', gameImage)
        console.log('After OTA selectedGame gameVersion', gameVersion)
        console.log('After OTA recommendedGames', recommendedGames)
        const updatedRecommendedGames = recommendedGames.filter((gameObj) => {
            // Extract the key (game name) from the object
            const gameKey = Object.keys(gameObj)[0];
            return gameKey !== game;
        });
        console.log('After OTA updatedRecommendedGames', updatedRecommendedGames)
        const updatedDownloadedGames = [...downloadedGames, {
            [game]: [
                { version: gameVersion },
                { category: gameCategory },
                { imageUrl: gameImage },
                { yaml_path: gameYamlPath },
                { resources: gameResources },
                { priority: gamePriority },
            ]
        }];
        const payload = {
            "games": {
                "downloaded": updatedDownloadedGames,
                "recommended": updatedRecommendedGames,
                "running": playingGames,
                "stopped": stoppedGames,
            },
        }
        await updateGamesServer(payload);
        // setDownloadedGames(updatedDownloadedGames);
        // setRecommendedGames(updatedRecommendedGames);
    };

    const pollGameStoppingStatus = async (gameName) => {
        // if (isPollingRef.current) return; // Prevent multiple polling instances
        isPollingActiveRef.current = true;
        console.log('isPollingActiveRef', isPollingActiveRef.current)
        try {
            const response = await axios.get(checkQmStopValueUrl);
            console.log("qm_info_games_stopped_apps status:", response.data.qm_info_games_stopped_apps);

            // Check if the gameName exists in the returned list
            const stoppedGamesList = response.data.qm_info_games_stopped_apps || [];

            if (!stoppedGamesList.includes(gameName)) {
                if (isPollingActiveRef.current) {  // Show the pop-up only if stopGame triggered polling
                    setShowStatusPopup(true);
                    setStatusPopupMessage("Termination of game is in progress...");
                }
                // Continue polling every 2 seconds until the game is detected
                setTimeout(() => pollGameStoppingStatus(gameName), 2000);
            } else {
                // Game is now stopped, proceed with the next steps
                console.log('stopping.........')
                await moveGamesFromRunningToStopped(stoppedGamesList);
                await axios.post(clearQmValueUrl);
                await loadGames();

                closeWindows(gameName);

                setShowStatusPopup(false);
                isPollingActiveRef.current = false;
                isStoppingGameRef.current = false; // Reset stopping game flag
            }
        } catch (error) {
            console.error("Error polling qm_info_games_running_apps:", error);
            // isPollingRef.current = false;
            isPollingActiveRef.current = false; // Reset polling flag on error
        }
    };

    const handleStopGame = async (gameName) => {
        try {
            await axios.post(setStopActionUrl, { gameName: gameName });

            setShowStatusPopup(true);
            setStatusPopupMessage("Termination of game is in progress...");

            if (!isPollingActiveRef.current) {
                pollGameStoppingStatus(gameName);
            };

            // Start polling after receiving 200 OK from /playGames
            // if(!isPollingRef.current){
            //     isStoppingGameRef.current = true;
            //     pollGameStatus();
            //     // pollGameStoppingStatus(gameName);
            // }else {
            //     // Polling is already running, so immediately show pop-up
            //     setShowStatusPopup(true);
            //     setStatusPopupMessage("Termination of game is in progress...");
            // }

            // const payload = {
            //     "gameName": gameName,
            // };
            // const stopGameResponse = await axios.post(`${SERVER_URL}/stopGame`, payload);
            // console.log('stopGameResponse', stopGameResponse);

            // if (stopGameResponse.status !== 200) {
            //     throw new Error("Failed to stop game");
            // }

        }
        catch (err) {
            console.error("Error stopping game:", err);
        }
    };

    const checkForDownloadGameStatus = (gameName) => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const response = await axios.get(`${SERVER_URL}/getAvailableQmApp`);
                    const availableGame = response.data.available_qm_app;

                    console.log("Current available_qm_app:", availableGame);

                    if (availableGame === gameName) {
                        clearInterval(interval);
                        await loadGames();
                        setShowStatusPopup(false);
                        console.log(`Game ${gameName} is now available. Hiding popup.`);
                        resolve();
                    }
                } catch (error) {
                    console.error("Error fetching available_qm_app:", error);
                    reject(error);
                }
            }, 2000); // Poll every 2 seconds
        });
    };

    //OTA Request
    const handleRecommendedGameCardClick = async (gameName, gameVersion) => {
        setShowStatusPopup(true);
        setStatusPopupMessage("Downloading is in-progress!")
        // setGameLoading((prevLoading) => ({ ...prevLoading, [gameName]: true }));
        // incrementManifestVersion();
        console.log('game name clicked', gameName);
        console.log('game version', gameVersion);
        // console.log('while making OTA request manifest version', manifestVersion.current);
        // const freeResourceUrl="http://18.179.41.155:5000/freeResource";
        // const url = "http://127.0.0.1:5001/gameServer";
        const payload = {
            game: gameName,
            VIN: VIN,
            version: gameVersion,
        };
        try {
            const gamesResponse = await axios.post(otaUrl, payload);
            console.log('gamesResponse', gamesResponse);
            if (gamesResponse.status === 200) {


                // console.log('Infotainment updated successfully.', currentRecommendedGames);
                const selectedGame = currentRecommendedGames.filter((game) => {
                    // Extract the key (game name) from the object
                    const gameKey = Object.keys(game)[0];
                    return gameKey === gameName;
                });
                console.log("selectedGame", selectedGame[0])


                await checkForDownloadGameStatus(gameName);

                await handleOtaGameUpdate(selectedGame[0]);
            }
        }
        catch (err) {
            console.error('Error in sending game to the server', err);
        }
    };

    const handleGameUpdateTrigger = async (game) => {
        console.log('Update trigger fn', game)
        console.log('new version available', newAvailableVersion.current);

        setShowStatusPopup(true);
        setStatusPopupMessage("Update is in-progress. Please wait..")

        const payload = {
            game: game,
            VIN: VIN,
            version: newAvailableVersion.current,
        };
        try {
            const gamesResponse = await axios.post(otaUrl, payload);
            console.log('gamesResponse', gamesResponse);
            if (gamesResponse.status === 200) {
                // const downloadedGame = currentDownloadedGames.find(gameObj => Object.keys(gameObj)[0] === game);
                // console.log('downloadedGame',downloadedGame)

                await checkForDownloadGameStatus(game);

                const updatePayload = {
                    gameName: game,
                    newVersion: newAvailableVersion.current
                };

                await axios.post(infoServerUpdateUrl, updatePayload);

                loadGames();
            }
        }
        catch (err) {
            console.error('Error in sending game to the server', err);
        }
    };

    const pollGameRunningStatus = async (gameName) => {
        try {
            const response = await axios.get(checkQmValueUrl);
            console.log("qm_info_games_running_apps status:", response.data);

            // Check if the gameName exists in the returned list
            const runningGamesList = response.data.qm_info_games_running_apps || [];
            const lackOfResources = response.data.lack_of_resources || {};
            const lackOfResourcesGame = response.data.lack_of_resources.app || "";
            const insufficientResources = lackOfResources.insufficient_resources || [];

            // Check if resources are insufficient
            if (lackOfResourcesGame === gameName) {
                const resourcesText = insufficientResources.length > 0
                    ? `(${insufficientResources.join(", ")})`
                    : "";
                setShowPopup(true);
                setPopupMessage(`Insufficient resources ${resourcesText} to launch the game!`);
                console.error("Resources are insufficient for", gameName);
                //clear the lack_of_resources key after reading it
                axios.post(clearLackOfResourceUrl)
                    .then(response => console.log("Cleared Redis key:", response.data))
                    .catch(error => console.error("Error clearing Redis key:", error));
                return false; // Stop polling
            }

            if (!runningGamesList.includes(gameName)) {
                setShowStatusPopup(true);
                setStatusPopupMessage("Initialization in progress...");
                // Continue polling every 2 seconds until the game is detected
                await new Promise(resolve => setTimeout(resolve, 2000));
                return pollGameRunningStatus(gameName);
            } else {
                // Game is now running, return success
                setShowStatusPopup(false);
                console.log(`${gameName} is now running!`);
                return true;
            }
        } catch (error) {
            console.error("Error polling qm_info_games_running_apps:", error);
            return false;
        }
    };

    //While polling for priority based deletion, followin function handles the case if after stopping any game is still present in "running" field of "infotainment" key
    const moveGamesFromRunningToStopped = async (stoppedGames) => {
        try {
            if (!stoppedGames.length) {
                console.log("No stopped games to process.");
                return;
            }

            const payload = { games: stoppedGames };

            console.log("Checking infotainment running games for:", stoppedGames);
            const response = await axios.post(`${SERVER_URL}/checkAndMoveGames`, payload);

            if (response.status === 200) {
                console.log("Infotainment games moved successfully:", response.data);
            } else {
                console.log("No games moved from infotainment.");
            }
        } catch (error) {
            console.error("Error checking/moving games in infotainment:", error);
        }
    };


    //Poll for the case when priority deletion is done from Vehicle State UI
    const pollGameStatus = async () => {
        if (isPollingActiveRef.current) return;
        isPollingActiveRef.current = true;

        const pollInterval = setInterval(async () => {
            try {
                // Fetch the list of running games
                const runningResponse = await axios.get(checkQmValueUrl);
                const runningGames = runningResponse.data.qm_info_games_running_apps;

                // Fetch stopped games
                const stoppingResponse = await axios.get(checkQmStopValueUrl);
                console.log("qm_info_games_stopped_apps status:", stoppingResponse.data.qm_info_games_stopped_apps);

                // Check if the gameName exists in the returned list
                const stoppedGames = stoppingResponse.data.qm_info_games_stopped_apps || [];

                if (!runningGames || runningGames.length === 0) {
                    console.log("No games running. Stopping polling...");
                    clearInterval(pollInterval);
                    isPollingActiveRef.current = false;

                    await moveGamesFromRunningToStopped(stoppedGames);
                    await axios.post(clearQmValueUrl);
                    await loadGames();
                    setShowStatusPopup(false);
                    closeWindows('astray');
                    closeWindows('pacman');
                    closeWindows('spaceinvaders');
                    return;
                }


                if (stoppedGames && stoppedGames.length > 0) {
                    let movedGame = false; // Flag to track if at least one game was moved
                    for (const game of stoppedGames) {
                        if (["astray", "pacman", "spaceinvaders"].includes(game)) {
                            // Check if game is still in running before making the API call
                            // if (!runningGames.includes(game)) continue; 

                            console.log(`Moving ${game} from running to stopped.`);
                            const payload = {
                                "gameName": game,
                            };
                            const stopGameResponse = await axios.post(`${SERVER_URL}/stopGame`, payload);
                            console.log('stopGameResponse', stopGameResponse);

                            if (stopGameResponse.status === 200) {
                                movedGame = true;
                                await loadGames();
                                closeWindows(game);
                                setShowStatusPopup(false);
                            } else if (stopGameResponse.status === 404) {
                                console.log('Game not found in running')
                            }
                            else {
                                throw new Error("Failed to move the game from running to stopped");
                            }
                        }
                    }
                    // Call loadGames() if at least one game was moved
                    // if (movedGame) {
                    //     await loadGames();
                    // }
                }
                console.log('Polling continued for stopped app');
            } catch (error) {
                console.error("Error polling game status:", error);
            }
        }, 2000);
    };

    const startGame = async (game) => {
        try {
            await axios.post(setActionUrl, { gameName: game });

            const isGameRunning = await pollGameRunningStatus(game);
            console.log("isGameRunning:", isGameRunning);

            if (!isGameRunning) {
                console.error("Game is not running, stopping execution.");
                return;
            }

            // Now, proceed with starting the game
            const payload = { "gameName": game };
            const loadDownloadGamesResponse = await axios.post(url, payload);
            console.log("loadDownloadGamesResponse", loadDownloadGamesResponse);

            if (loadDownloadGamesResponse.status !== 200) {
                throw new Error("Failed to start game");
            }

            const gamesData = loadDownloadGamesResponse.data;

            setPlayingGames((prevPlayingGames) => {
                const gameDetails = gamesData[game];
                const isAlreadyPlaying = prevPlayingGames.some((gameObj) => Object.keys(gameObj)[0] === game);
                return isAlreadyPlaying ? prevPlayingGames : [...prevPlayingGames, { [game]: gameDetails }];
            });

            let gameUrl=browserTabUrl;
            if (game === 'astray')  gameUrl+= ":6010/";
            if (game === 'pacman')  gameUrl+= ":6011/";
            if (game === 'spaceinvaders') gameUrl+= ":6012/";

            console.log('Opening URL:', gameUrl);
            openWindow(game,gameUrl);

            if (!isPollingActiveRef.current) {
                pollGameStatus();
            }
            // if (!isPollingRef.current) {
            //     isStoppingGameRef.current = false;
            //     pollGameStoppingStatus(game);
            // }

        }
        catch (err) {
            console.error("Error starting the game:", err);
        }
    };

    const handleDownloadGameCardClick = async (game) => {

        console.log('currentdownloadedGames version', currentDownloadedGames);

        let fetchedVersion = null; // Initialize variable

        try {
            // Version check for update
            const versionResponse = await axios.post(version_check_url, { gameName: game });
            fetchedVersion = versionResponse.data.version;
            console.log(`Fetched version for ${game}:`, fetchedVersion);
        } catch (error) {
            console.error("Version check failed:", error);
            // Continue execution even if this API fails
        }

        try {
            //version check for update
            // const versionResponse = await axios.post(version_check_url, { gameName: game });
            // const fetchedVersion = versionResponse.data.version;

            // console.log(`Fetched version for ${game}:`, fetchedVersion);

            const downloadedGame = currentDownloadedGames.find(gameObj => Object.keys(gameObj)[0] === game);

            if (!downloadedGame) {
                console.log("Game not found in downloaded games list.");
                return;
            }

            const localVersion = downloadedGame[game].find(item => item.version)?.version;

            console.log(`Local version for ${game}:`, localVersion);

            // If version check was successful and versions differ, show update popup
            if (fetchedVersion && fetchedVersion !== localVersion) {
                newAvailableVersion.current = fetchedVersion;
                setSelectedDownloadGame(game);
                setVersionPopupMessage(`Version update for ${game} is available.`);
                setShowVersionPopup(true);
                return;
            }

            //Game launch only when park mode is enabled
            const vehicleInfoResponse = await axios.get(getVehicleInfoUrl);
            const vehicleInfo = vehicleInfoResponse.data;

            // if (vehicleInfo.vehicle_state !== "drive") {
            if (true) {
                await startGame(game);
            } else {
                setPopupMessage('Vehicle is in drive mode. Please park the vehicle to launch the game.');
                setShowPopup(true);
            }


        } catch (error) {
            console.error("Error starting the game:", error);
        }
    };


    // const handleDownloadGameCardClick = async (game) => {
    //     const url = `${SERVER_URL}/playGame`;
    //     const checkQmValueUrl = `${SERVER_URL}/getQmRunningGames`;
    //     const clearQmValueUrl = `${SERVER_URL}/clearQmPlayValue`;
    //     const payload = {
    //         "gameName": game,
    //     };
    //     try {
    //         const loadDownloadGamesResponse = await axios.post(url, payload);
    //         console.log("loadDownloadGamesResponse", loadDownloadGamesResponse)
    //         const gamesData = loadDownloadGamesResponse.data;

    //         if (loadDownloadGamesResponse.status !== 200) {
    //             throw new Error("Failed to start game");
    //         }

    //         const pollGameRunningStatus = async (gameName) => {
    //             try {
    //                 const response = await axios.get(checkQmValueUrl);
    //                 console.log("qm_info_games_running_apps status:", response.data.qm_info_games_running_apps);

    //                 // Check if the gameName exists in the returned list
    //                 const runningGamesList = response.data.qm_info_games_running_apps || [];

    //                 if (!runningGamesList.includes(gameName)) {
    //                     setShowStatusPopup(true);
    //                     setStatusPopupMessage("Game Play initialization is in progress...");
    //                     // Continue polling every 2 seconds until the game is detected
    //                     setTimeout(() => pollGameRunningStatus(gameName), 2000);
    //                 } else {
    //                     // Game is now running, proceed with the next steps
    //                     setShowStatusPopup(false);
    //                     console.log(`${gameName} is now running!`);

    //                     setPlayingGames((prevPlayingGames) => {
    //                         const gameDetails = gamesData[gameName];
    //                         const isAlreadyPlaying = prevPlayingGames.some((gameObj) => Object.keys(gameObj)[0] === gameName);
    //                         return isAlreadyPlaying ? prevPlayingGames : [...prevPlayingGames, { [gameName]: gameDetails }];
    //                     });

    //                     if (gameName === 'astray') browserTabUrl += ":81/";
    //                     if (gameName === 'pacman') browserTabUrl += ":82/";
    //                     if (gameName === 'spaceinvaders') browserTabUrl += ":6010/";

    //                     console.log('Opening URL:', browserTabUrl);
    //                     window.open(browserTabUrl, "_blank");
    //                 }
    //             } catch (error) {
    //                 console.error("Error polling qm_info_games_running_apps:", error);
    //             }
    //         };

    //         // Start polling after receiving 200 OK from /playGames
    //         pollGameRunningStatus(game);


    //     } catch (error) {
    //         console.error("Error starting the game:", error);
    //     }
    // };

    return (
        <div style={{ height: '100%', width: '100%', padding: '20px', position: 'relative' }}>
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
                    handleGameUpdateTrigger(selectedDownloadGame); // Continue with the game launch
                }}
                onIgnore={() => {
                    setShowVersionPopup(false);
                    startGame(selectedDownloadGame); // Start game without checking version
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

            <div style={{ marginTop: '30px' }}>
                <Typography variant="h5" style={{ fontWeight: 'bold', color: 'white', }}>
                    Downloaded Games
                </Typography>
                {
                    downloadedGames.length > 0 ? (<div style={{ position: 'relative' }}>
                        <Grid container spacing={4} style={{
                            marginTop: '10px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '0 50px'
                        }}>
                            {
                                currentDownloadedGames.map((gameObj, index) => {
                                    const gameName = Object.keys(gameObj)[0];
                                    const gameDetails = gameObj[gameName];
                                    console.log("gameDetails", gameDetails)
                                    const isPlaying = playingGames.some((playingGame) => {
                                        const playingGameName = Object.keys(playingGame)[0];
                                        return playingGameName === gameName;
                                    });
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={gameDetails[2].imageUrl + index}>
                                            <Card elevation={12}
                                                sx={{
                                                    borderRadius: "16px",
                                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                                    position: "relative",
                                                    transform: activeGame === gameName ? "none" : "scale(1)", // Disable scaling for active game
                                                    boxShadow: activeGame === gameName ? "none" : "0px 4px 10px rgba(0, 0, 0, 0.3)", // Remove shadow if active
                                                    "&:hover": activeGame === gameName || isPlaying ? {} : { transform: "scale(1.05)" },
                                                    pointerEvents: isPlaying ? "none" : "auto",
                                                }}
                                                onClick={() => !isPlaying && handleDownloadGameCardClick(gameName)}
                                            // onClick={()=>handleGameCardClick(game.name)}
                                            >
                                                <CardMedia sx={{ cursor: 'pointer', borderRadius: '16px' }}
                                                    component="img"
                                                    height="200"
                                                    image={gameDetails[2].imageUrl}
                                                />
                                            </Card>
                                            {isPlaying && (
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    onClick={() => handleStopGame(gameName)}
                                                    style={{ marginTop: '-30px', display: 'block', width: '100%' }}
                                                >
                                                    Stop Game
                                                </Button>
                                            )}

                                            {/* {activeGame === game.name && (
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    onClick={() => setActiveGame(null)}
                                                    style={{ marginTop: '-30px', display: 'block', width: '100%' }}
                                                >
                                                    Stop Game
                                                </Button>
                                            )} */}
                                            {/* {activeGame === game.name && (
                                                <IconButton
                                                    onClick={(e) => { e.stopPropagation(); setActiveGame(null); }}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 8,
                                                        right: 8,
                                                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                                                        color: "white",
                                                        "&:hover": { backgroundColor: "rgba(255, 0, 0, 0.8)" },
                                                    }}
                                                >
                                                    <CancelIcon />
                                                </IconButton>
                                            )} */}
                                        </Grid>
                                    )
                                })}
                        </Grid>

                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '10px',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        }}>
                            <IconButton
                                onClick={handleDownloadedPrev}
                                disabled={currentDownloadedPage === 0}
                                sx={{
                                    '&:hover': {
                                        transform: 'scale(1.2)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    },
                                }}
                            >
                                <ArrowBackIosNew sx={{ color: 'white', }} />
                            </IconButton>
                        </div>

                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '10px',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        }}>
                            <IconButton
                                onClick={handleDownloadedNext}
                                disabled={(currentDownloadedPage + 1) * gamesPerPage >= downloadedGames.length}
                                sx={{
                                    '&:hover': {
                                        transform: 'scale(1.2)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    },
                                }}
                            >
                                <ArrowForwardIos sx={{ color: 'white', marginRight: '30px' }} />
                            </IconButton>
                        </div>
                    </div>) : (<p style={{ color: 'white', fontSize: '30px', textAlign: 'center', marginTop: '40px' }}>No Downloaded Games available!</p>)
                }

            </div>

            <div style={{ marginTop: '50px' }}>
                <Typography variant="h5" style={{ fontWeight: 'bold', color: 'white', }}>
                    Recommended Games
                </Typography>
                {
                    recommendedGames.length > 0 ? (<div style={{ position: 'relative' }}>
                        <Grid container spacing={4} style={{
                            marginTop: '10px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '0 50px'
                        }}>
                            {currentRecommendedGames.map((gameObj, index) => {
                                const gameName = Object.keys(gameObj)[0];
                                const gameDetails = gameObj[gameName];
                                console.log('recommended gameDetails', gameDetails)
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={gameDetails[2].imageUrl + index}>
                                        <Card elevation={12}
                                            sx={{
                                                borderRadius: '16px',
                                                boxShadow: '0px 4px 10px rgb(0, 0, 0)',
                                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.05)',
                                                },
                                            }}
                                            onClick={() => handleRecommendedGameCardClick(gameName, gameDetails[0].version)}
                                        >
                                            <CardMedia sx={{ cursor: 'pointer', borderRadius: '16px' }}
                                                component="img"
                                                height="200"
                                                image={gameDetails[2].imageUrl}
                                            // onClick={() => handleGameClick(game.imageUrl,game.name)}
                                            />
                                        </Card>
                                    </Grid>
                                )
                            })}
                        </Grid>

                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '10px',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        }}>
                            <IconButton
                                onClick={handleRecommendedPrev}
                                disabled={currentRecommendedPage === 0}
                                sx={{
                                    color: 'black',
                                    '&:hover': {
                                        transform: 'scale(1.2)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    },
                                }}
                            >
                                <ArrowBackIosNew sx={{ color: 'white', }} />
                            </IconButton>
                        </div>

                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '10px',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        }}>
                            <IconButton
                                onClick={handleRecommendedNext}
                                disabled={(currentRecommendedPage + 1) * gamesPerPage >= recommendedGames.length}
                                sx={{
                                    color: 'black',
                                    '&:hover': {
                                        transform: 'scale(1.2)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    },
                                }}
                            >
                                <ArrowForwardIos sx={{ color: 'white', marginRight: '30px' }} />
                            </IconButton>
                        </div>
                    </div>) : (<p style={{ color: 'white', fontSize: '30px', textAlign: 'center', marginTop: '40px' }}>No recommendations available!</p>)
                }

            </div>
        </div>
    );
};

export default Games;
