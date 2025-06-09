import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
  DialogContentText,
} from "@mui/material";
import Button from "@mui/material/Button";
import React, { useEffect, useRef, useState } from "react";
import ClockSkewButton from "./ClockSkew";
import { BASE_URL } from "./config";
import EventList from "./EventsList";
import GetData from "./GetData";
import RunTestcaseFile from "./RunTestcaseFile";
import SaveLog from "./SaveLogs";
import StartNetworkDelay from "./StartNetworkDelay";
import StartStress from "./StartStress";
import StopNetworkDelay from "./StopNetworkDelay";
import StopStress from "./StopStress";
import UploadFile from "./UploadFile";
import StopTestcase from "./StopTestcase";
//CPU section graph components
import AVPComponentCPU from "./AVPComponent_CPU";
// import DynamicCPU from "./DynamicPodCPU";

import CpuQmPod1 from "./CPU_QMPod1";
import CpuStressComponent from "./CPUStressComponent";
import TotalCPU from "./TotalCPU";
//Memory section graph components
import AvpComponentMemory from "./AVPComponent_Memory";
// import MemoryQmPod from "./Memory_QMPod";
import MemoryQmPod1 from "./Memory_QMPod1";
import MemoryStressComponent from "./MemoryStressComponent";
import TotalMemory from "./TotalMemory";
import axios from "axios";

//redux state management
import { useDispatch } from "react-redux";
import { setPodUsage } from "./utils/qmPodSlice";
import { setAvpCpu } from "./utils/avpCpuSlice";
import { setAvpMemory } from "./utils/avpMemorySlice";
import { setCpuUtilData } from "./utils/totalCpuUtilSlice";
import { setMemoryUtilData } from "./utils/totalMemoryUtilSlice";
import { setCpuStress, setMemoryStress } from "./utils/stressSlice";
import { setCpuDotIndicator, setMemoryDotIndicator } from "./utils/dotIndicatorSlice";

const App = () => {
  // CPU section - Initialisation of all chart containers for scrolling
  const totalcpuRef = useRef(null);
  const stressRef = useRef(null);
  const avpRef = useRef(null);
  const qmPod1Ref = useRef(null);
  // Memory section - Initialisation of all chart containers for scrolling
  const totalMemoryRef = useRef(null);
  const memoryStressRef = useRef(null);
  const avpMemoryRef = useRef(null);
  const qmPod1MemoryRef = useRef(null);
  //------------------------state variables - Initialisation-------------------------------------------
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  // State to control the visibility of the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [data, setData] = useState({});
  const [activeButton, setActiveButton] = useState(null);
  //Initialise array as 0 to show the spike on the stress component when stress applied
  const [stressIndicator, setStressIndicator] = useState([0]);
  const [runTestCaseArray, setRunTestCaseArray] = useState([0]);
  const [currentValue, setCurrentValue] = useState(0);
  // const [previousRunningStatus, setPreviousRunningStatus] = useState(null);
  const previousRunningStatus = useRef(null);
  const [historicalCpuData, setHistoricalCpuData] = useState({});
  const [historicalMemoryData, setHistoricalMemoryData] = useState({});
  const [dotIndicatorCPU, setdotIndicatorCPU] = useState([]);
  const [dotIndicatorMemory, setdotIndicatorMemory] = useState([]);
  // cpu & memory data initialisation to send to the respective components(CpuStressComponent & MemoryStressComponent)
  const [cpuStressData, setCpuStressData] = useState([]);
  const [memoryStressSpike, setMemoryStressSpike] = useState([]);
  // cpu & memory data initialisation to send to the respective components(TotalCpu & TotalMemory)
  const [cpuData, setCpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  // avp-cpu & avp-memory  value state variable initialisation
  const [avgAvpCpu, setAvgAvpCpu] = useState(0);
  const [avgAvpMemory, setAvgAvpMemory] = useState(0);
  //timeStamp state variable initialisation
  const [timePart, setTimePart] = useState("");
  //podUsage state variable initialisation to send to the respective components(CpuQmPod1 & MemoryQmPod1)
  const [podUsage_new, setPodUsage_new] = useState([]);
  const [isDialogAcknowledged, setIsDialogAcknowledged] = useState(false);

  const [responseLocal,setResponse]=useState(null);

  // Use a ref to store the interval ID
  const intervalRef = useRef(null);

  //Redux useDispatch hook
  const dispatch = useDispatch();

  //currentrunningStatus initialisation
  // Handles scroll events to synchronize scrollbar positions across CPU and memory sections.
  const handleScroll = (event) => {
    const scrollLeft = event.target.scrollLeft;
    // Synchronize scrolling for CPU section components based on the source of the scroll event.
    if (
      totalcpuRef.current &&
      stressRef.current &&
      avpRef.current &&
      qmPod1Ref.current
    ) {
      // Synchronizes scroll position of all CPU section components to match the scrolled component.
      if (event.target === totalcpuRef.current) {
        stressRef.current.scrollLeft = scrollLeft;
        avpRef.current.scrollLeft = scrollLeft;
        qmPod1Ref.current.scrollLeft = scrollLeft;
      } else if (event.target === stressRef.current) {
        totalcpuRef.current.scrollLeft = scrollLeft;
        avpRef.current.scrollLeft = scrollLeft;
        qmPod1Ref.current.scrollLeft = scrollLeft;
      } else if (event.target === avpRef.current) {
        totalcpuRef.current.scrollLeft = scrollLeft;
        stressRef.current.scrollLeft = scrollLeft;
        qmPod1Ref.current.scrollLeft = scrollLeft;
      } else if (event.target === qmPod1Ref.current) {
        totalcpuRef.current.scrollLeft = scrollLeft;
        stressRef.current.scrollLeft = scrollLeft;
        avpRef.current.scrollLeft = scrollLeft;
      }
    }
    // Synchronize scrolling for memory section components similarly.
    if (
      totalMemoryRef.current &&
      memoryStressRef.current &&
      avpMemoryRef.current &&
      qmPod1MemoryRef.current
    ) {
      // Synchronizes scroll position of all memory section components to match the scrolled component.
      if (event.target === totalMemoryRef.current) {
        memoryStressRef.current.scrollLeft = scrollLeft;
        avpMemoryRef.current.scrollLeft = scrollLeft;
        qmPod1MemoryRef.current.scrollLeft = scrollLeft;
      } else if (event.target === memoryStressRef.current) {
        totalMemoryRef.current.scrollLeft = scrollLeft;
        avpMemoryRef.current.scrollLeft = scrollLeft;
        qmPod1MemoryRef.current.scrollLeft = scrollLeft;
      } else if (event.target === avpMemoryRef.current) {
        totalMemoryRef.current.scrollLeft = scrollLeft;
        memoryStressRef.current.scrollLeft = scrollLeft;
        qmPod1MemoryRef.current.scrollLeft = scrollLeft;
      } else if (event.target === qmPod1MemoryRef.current) {
        totalMemoryRef.current.scrollLeft = scrollLeft;
        memoryStressRef.current.scrollLeft = scrollLeft;
        avpMemoryRef.current.scrollLeft = scrollLeft;
      }
    }
  };
  // Sets the active button state to change its color on click.
  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };
  // Closes the dialog by setting showMessage to false.
  const handleClose = () => {
    setShowMessage(false);
  };
  // Function to close the dialog
  const handleClose_podUsage = () => {
    setIsDialogOpen(false);
  };
  // Periodically fetches application data and updates UI state based on the response.

  const fetchData=()=>{
    // const startTime = new Date().getTime();
    fetch(`${BASE_URL}/get_apps`)
      .then((response) => response.json())
      .then((response) => {
          setResponse(response);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });   
  };
  
  useEffect(() => {
    fetchData();
    // Set up the interval on the first mount only
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, 600); 
    }
  
    // Cleanup the interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if(responseLocal){
    setStressIndicator((prevArray) => [...prevArray, currentValue]);
          setRunTestCaseArray((prevArray) => [...prevArray, currentValue]);
          const timestamp = responseLocal.time;
          setTimePart(timestamp.split(" ")[1].split(".")[0]);
          // setTimePart(timestamp.split(" ")[1]);
          const podUsage = responseLocal.pod_usage || [];
          setPodUsage_new(podUsage);

          //dispatch the setPodUsage action and update the reducer function in redux store, by
           //passing the data as action.payload
          dispatch(setPodUsage(podUsage));
    
          const respCPU = parseFloat(responseLocal.avg_cpu);
          let avgCpu = respCPU > 100 ? 100 : respCPU;
    
          const respMemory = parseFloat(responseLocal.avg_memory);
          let avgMemory = respMemory > 100 ? 100 : respMemory;
    
          const cpuStress = [
            parseFloat(responseLocal.cpu_stress),
            parseFloat(responseLocal.current_inc_cpu_stress),
          ];
          const memoryStress = [
            parseFloat(responseLocal.memory_stress),
            parseFloat(responseLocal.current_inc_mem_stress),
          ];
          const fetchedEvents = responseLocal.events;
          const fetchedData =
          responseLocal.running_apps.length > 0
              ? responseLocal.running_apps
              : responseLocal.deleted_apps;
    
          const avp_cpu = parseFloat(responseLocal.avg_avp_cpu_usage);
          const avp_memory = parseFloat(responseLocal.avg_avp_memory_usage);
    
          //.......................... stop Stress once the AVP Trigger is received  ................................
    
          const handleStopStress = async () => {
            try {
              const response = await axios.post(`${BASE_URL}/stop_stress`);
            } catch (error) {
              console.error("Error stopping stress:", error);
            }
          };
    
          if (
            responseLocal.stress_applied === "true" &&
            responseLocal.deleted_apps.length > 0
          ) {
            handleStopStress();
          }
    
          // ....................End of AVP Trigger -------------------------------------------------------------------------------
    
          // Attaches scroll event listeners to chart elements for synchronized scrolling, or logs an error if any chart is missing.
    
          const t_cpu_chart = totalcpuRef.current;
          const stress_chart = stressRef.current;
          const avp_chart = avpRef.current;
          const qmPod1_chart = qmPod1Ref.current;
          // const qmPod2_chart = qmPod2Ref.current;
    
          if (
            t_cpu_chart &&
            stress_chart &&
            avp_chart &&
            qmPod1_chart
            // qmPod2_chart
          ) {
            t_cpu_chart.addEventListener("scroll", handleScroll);
            stress_chart.addEventListener("scroll", handleScroll);
            avp_chart.addEventListener("scroll", handleScroll);
            qmPod1_chart.addEventListener("scroll", handleScroll);
            // qmPod2_chart.addEventListener("scroll", handleScroll);
          } else {
            console.log(" CPU chart is not available");
          }
          // Attaches scroll event listeners to chart elements for synchronized scrolling, or logs an error if any chart is missing.
          const t_memory_chart = totalMemoryRef.current;
          const memoryStress_chart = memoryStressRef.current;
          const avp_memory_chart = avpMemoryRef.current;
          const qmPod1_memory_chart = qmPod1MemoryRef.current;
          // const qmPod2_memory_chart = qmPod2MemoryRef.current;
    
          if (
            t_memory_chart &&
            memoryStress_chart &&
            avp_memory_chart &&
            qmPod1_memory_chart
            // qmPod2_memory_chart
          ) {
            t_memory_chart.addEventListener("scroll", handleScroll);
            memoryStress_chart.addEventListener("scroll", handleScroll);
            avp_memory_chart.addEventListener("scroll", handleScroll);
            qmPod1_memory_chart.addEventListener("scroll", handleScroll);
            // qmPod2_memory_chart.addEventListener("scroll", handleScroll);
          } else {
            console.log("MEMORY chart is not available");
          }
    
          //-----------------------------------End of adding event listeners to the CPU & Memory components--------------------------------------------------------
    
          let avpCpuTotal = 0;
          let avpMemoryTotal = 0;
          const updatedHistoricalCpuData = { ...historicalCpuData };
          const updatedHistoricalMemoryData = { ...historicalMemoryData };
          podUsage.forEach((pod) => {
            const [podName, cpuUsage, memoryUsage] = pod;
            const cpuUsageFloat = parseFloat(cpuUsage);
            const memoryUsageFloat = parseFloat(memoryUsage);
            if (!updatedHistoricalCpuData[podName]) {
              updatedHistoricalCpuData[podName] = [];
            }
            updatedHistoricalCpuData[podName].push(cpuUsageFloat);
    
            if (!updatedHistoricalMemoryData[podName]) {
              updatedHistoricalMemoryData[podName] = [];
            }
            updatedHistoricalMemoryData[podName].push(memoryUsageFloat);
    
            if (podName.startsWith("avp.")) {
              avpCpuTotal += cpuUsageFloat;
              avpMemoryTotal += memoryUsageFloat;
              // avpCount += 1;
            }
          });
    
          Object.keys(updatedHistoricalCpuData).forEach((podName) => {
            if (!podUsage.some((pod) => pod[0] === podName)) {
              updatedHistoricalCpuData[podName].push(0);
            }
          });
    
          Object.keys(updatedHistoricalMemoryData).forEach((podName) => {
            if (!podUsage.some((pod) => pod[0] === podName)) {
              updatedHistoricalMemoryData[podName].push(0);
            }
          });
          if (fetchedData.length > 0) {
            let currentRunningStatus = fetchedData[0]?.pod_running_status || ""; // T or F
    
            if (currentRunningStatus.length === 0 && !isDialogAcknowledged) {
              // Open the dialog
              setIsDialogOpen(true);
              setIsDialogAcknowledged(true);
            }
            let indicatorConfig = {
              value: 0,
              color: "transparent",
              pointRadius: 0,
            };
            let indicatorConfigMemory = {
              value: 0,
              color: "transparent",
              pointRadius: 0,
            };
            if (currentRunningStatus !== previousRunningStatus.current) {
              indicatorConfig = {
                value: avgCpu, // Assuming the same avgCpu/avgMemory for both
                color: currentRunningStatus === "true" ? "green" : "red",
                pointRadius: 5,
                label:
                  currentRunningStatus === "true"
                    ? "Pod Running"
                    : "Pod Not Running",
              };
    
              indicatorConfigMemory = {
                value: avgMemory, // Assuming the same avgCpu/avgMemory for both
                color: currentRunningStatus === "true" ? "green" : "red",
                pointRadius: 5,
                label:
                  currentRunningStatus === "true"
                    ? "Pod Running"
                    : "Pod Not Running",
              };
            }
    
            // setdotIndicatorCPU((prevArray) => [...prevArray, indicatorConfig]);
            // setdotIndicatorMemory((prevArray) => [
            //   ...prevArray,
            //   indicatorConfigMemory,
            // ]);

            setdotIndicatorCPU((prevArray) => {
              const updatedData=[...prevArray, indicatorConfig];
    
              dispatch(setCpuDotIndicator(updatedData));
    
              return updatedData;
            });
            setdotIndicatorMemory((prevArray) => {
              const updatedData=[
                ...prevArray,
                indicatorConfigMemory,
              ];
              dispatch(setMemoryDotIndicator(updatedData));
    
              return updatedData;
            });
            previousRunningStatus.current = currentRunningStatus;
          }
    
          // cpu and memory data sets to maintain the historial cpu and memory data
          const cpuDatasets = Object.keys(updatedHistoricalCpuData).map(
            (podName, index) => ({
              podName,
              timePart,
              value:
                updatedHistoricalCpuData[podName][
                  updatedHistoricalCpuData[podName].length - 1
                ],
            })
          );
    
          const memoryDatasets = Object.keys(updatedHistoricalMemoryData).map(
            (podName, index) => ({
              podName,
              timePart,
              value:
                updatedHistoricalMemoryData[podName][
                  updatedHistoricalMemoryData[podName].length - 1
                ],
            })
          );
          //end of historical cpu and memory data
          //setting cpu and memory data
          // setCpuData((prevData) => [
          //   ...prevData,
          //   { timePart, avgCpu, avpCpuTotal, cpuStress },
          //   ...cpuDatasets,
          // ]);
    
          // setMemoryData((prevData) => [
          //   ...prevData,
          //   { timePart, avgMemory, avpMemoryTotal, memoryStress },
          //   ...memoryDatasets,
          // ]);

          setCpuData((prevData) => {
            const updatedData=[
              ...prevData,
              { timePart, avgCpu, avpCpuTotal, cpuStress },
              ...cpuDatasets,
            ];
            dispatch(setCpuUtilData(updatedData));
    
            return updatedData;
          });
    
          setMemoryData((prevData) => {
            const updatedData=[
              ...prevData,
              { timePart, avgMemory, avpMemoryTotal, memoryStress },
              ...memoryDatasets,
            ];
            dispatch(setMemoryUtilData(updatedData));
    
            return updatedData;
          });
          // end of setting cpu and memory data
          setCpuStressData((prevData) => [
            ...prevData,
            { timePart, cpuStress },
          ]);
          setMemoryStressSpike((prevData) => [
            ...prevData,
            { timePart, memoryStress },
          ]);
          //setting backend data to the state varibles
          setHistoricalCpuData(updatedHistoricalCpuData);
          setHistoricalMemoryData(updatedHistoricalMemoryData);
          setEvents(fetchedEvents);
          setData(fetchedData);
          setAvgAvpCpu(avp_cpu);
          setAvgAvpMemory(avp_memory);

          //dispatchers to update the redux store
          dispatch(setAvpCpu(avp_cpu));
          dispatch(setAvpMemory(avp_memory));
          dispatch(setCpuStress(cpuStressData));
          dispatch(setMemoryStress(memoryStressSpike));
        }
    }, [responseLocal]);

  return (
    <Grid
      container
      spacing={2}
      padding="10px"
      sx={{ backgroundColor: "#cdcdcd" }}
    >
      <Grid item xs={6}>
        <Stack spacing={1}>
          {/* CPU Section */}
          {timePart && (
            <TotalCPU
              // cpuData={cpuData}
              ref={totalcpuRef}
              podStatus={dotIndicatorCPU}
            />
          )}
          {timePart && (
            <AVPComponentCPU
              // avgAvpCpu={avgAvpCpu}
              timePart={timePart}
              ref={avpRef}
            />
          )}
          {timePart && (
            <CpuQmPod1
              // podUsage_new={podUsage_new}
              timePart={timePart}
              ref={qmPod1Ref}
              // ref={i === 0 ? qmPod1Ref : qmPod2Ref} // Adjust if ref logic is different
            />
          )}
          {timePart && (
            <CpuStressComponent 
            // stressData={cpuStressData}
             ref={stressRef} />
          )}
        </Stack>
      </Grid>

      {/* Memory Section */}
      <Grid item xs={6}>
        <Stack spacing={1}>
          {timePart && (
            <TotalMemory
              // memoryData={memoryData}
              ref={totalMemoryRef}
              pod={dotIndicatorMemory}
            />
          )}

          {timePart && (
            <AvpComponentMemory
              // avgAvpMemory={avgAvpMemory}
              timePart={timePart}
              ref={avpMemoryRef}
            />
          )}
          {timePart && (
            <MemoryQmPod1
              // podUsage_new={podUsage_new}
              timePart={timePart}
              ref={qmPod1MemoryRef}
              // ref={i === 0 ? qmPod1MemoryRef : qmPod2MemoryRef} // Adjust if ref logic is different
            />
          )}

          {timePart && (
            <MemoryStressComponent
              // memoryStressData={memoryStressSpike}
              ref={memoryStressRef}
            />
          )}
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <Stack
          direction="row"
          divider={<Divider orientation="vertical" flexItem />}
          spacing={2}
          padding="20px"
        >
          <StartStress
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
          />
          <StartNetworkDelay
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
            setCurrentValue={setCurrentValue}
          />
          <ClockSkewButton
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
          />
          <StopStress
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
          />
          <StopNetworkDelay
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
            setCurrentValue={setCurrentValue}
          />
          <SaveLog
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
          />
          <RunTestcaseFile
            setCurrentValue={setCurrentValue}
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
          />
          <StopTestcase
            setCurrentValue={setCurrentValue}
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
          />
          <UploadFile
            setMessage={setMessage}
            setShowMessage={setShowMessage}
            activeButton={activeButton}
            handleButtonClick={handleButtonClick}
          />
        </Stack>

        <Grid item xs={12}>
          <Stack
            direction="row"
            divider={<Divider orientation="vertical" flexItem />}
            spacing={2}
            padding="20px"
            marginLeft="15%"
          >
            <EventList events={events} />
            <GetData data={data} />
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={showMessage}
        onClose={handleClose}
        sx={{
          "& .MuiDialog-paper": { borderRadius: "16px" }, // Adjust the value as needed
        }}
      >
        <DialogTitle sx={{ fontSize: "1.8rem" }}>Message</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "1.3rem" }} variant="subtitle1">
            {message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            variant="contained"
            color="primary"
            sx={{ borderRadius: "16px" }} // Adjust the value as needed
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isDialogOpen} onClose={handleClose_podUsage}>
        <DialogTitle>{"Oops ! Apps are not running... "}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            We couldn't find any pod usage data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose_podUsage}
            color="primary"
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default App;
