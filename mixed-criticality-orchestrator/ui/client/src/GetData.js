import React from "react";
import {
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import DataTable from "./DataTable"; // Adjust import path as needed

function GetData({ data }) {
  if (!Array.isArray(data)) {
    // Optionally, render a fallback UI or return null
    return <div>No data available</div>;
  }

  return (
    <Paper className="get-data" elevation={3}>
      <Typography variant="h6" component="h2" gutterBottom align="center">
        Running Apps Data
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Pod Name</TableCell>
            <TableCell>Pod Running Status</TableCell>
            <TableCell>Priority</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((app, index) => (
            <DataTable
              key={index}
              data={app}
              status={app.pod_running_status === "true"}
            />
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default GetData;
