import React, { useState, useEffect } from "react";
import axios from "axios";
import { Paper, Typography, Box } from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";

const WeatherApp = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const cloud_bg = [
    {
      image_url:
        "https://media.istockphoto.com/id/1092506504/photo/beautiful-sky-with-white-cloud.jpg?s=612x612&w=0&k=20&c=2FY3wKBVhs5n3BMgR0fhYbWsxxCXtTkslOUOtsCs5vE=",
    },
  ];

  const getWeatherData = async () => {
    try {
      // Fetch geocoding data
      const geoResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=Bangalore`
      );

      const results = geoResponse.data.results;

      if (!results || results.length === 0) {
        throw new Error("City not found.");
      }

      // Extract latitude and longitude
      const { latitude, longitude } = results[0];

      // Fetch weather data using latitude and longitude
      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );

      const currentWeather = weatherResponse.data.current_weather;
      setWeather({
        temperature: currentWeather.temperature,
        windspeed: currentWeather.windspeed,
        precipitation: weatherResponse.data.hourly?.precipitation_sum?.[0] || 0,
        humidity: weatherResponse.data.hourly?.relative_humidity_2m?.[0] || 0,
      });
      setError("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setWeather(null);
    }
  };

  useEffect(() => {
    getWeatherData();
  }, []);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100%"
    >
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          width: "100%",
          height: "100%",
          textAlign: "left",
          borderRadius: "10px",
          backgroundImage: `url(${cloud_bg[0].image_url})`,
          // background: "linear-gradient(to top, #87CEEB, #ffffff)", // Gradient from Skyblue to White
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom color="white">
          Bengaluru, India
        </Typography>

        {
        (
          <div>
            <Typography
              variant="h2"
              fontWeight="bold"
              gutterBottom
              color="white"
            >
              {weather?weather.temperature:'-'}°C
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              sx={{ marginBottom: "10px", color: "white" }}
            >
              <Typography variant="h5" sx={{ marginRight: "8px" }}>
                Cloudy
              </Typography>
              <CloudIcon />
            </Box>
            <Box
              display="flex"
              justifyContent="space-between"
              mt={2}
              sx={{
                fontSize: "14px",
              }}
            >
              <Typography color="white">
                <strong>Precipitation:</strong> {weather?weather.precipitation:'-'}%
              </Typography>
              <Typography color="white">
                <strong>Wind Speed:</strong> {weather?weather.windspeed:'-'} km/h
              </Typography>
            </Box>
          </div>
        ) 
        }
      </Paper>
    </Box>
  );
};

export default WeatherApp;