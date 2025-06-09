import React from "react";
import { Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import "./EventListScrollbar.css";
function EventList({ events }) {
  return (
    <Paper className="events" elevation={3}>
      <Typography variant="h6" className="event_heading">
        Events
      </Typography>
      <List className="event-items" component="nav">
        {events.map((event, index) => {
          const isLFTrigger = event.includes("LF Trigger applied on system");
          return (
            <ListItem key={index}>
              <ListItemText
                primary={event}
                style={{ color: isLFTrigger ? "red" : "inherit" }}
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}

export default EventList;
