import React from "react";
import { TableRow, TableCell, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";

function DataTable({ data, status }) {
  return (
    <TableRow>
      <TableCell>{data.name}</TableCell>
      <TableCell>{data.pod_name}</TableCell>
      <TableCell>
        <Typography
          variant="body1"
          component="span"
          style={{
            color: status ? "green" : "red",
            display: "flex",
            alignItems: "center",
          }}
        >
          {status ? <CheckCircleOutlineIcon /> : <CancelIcon />}
          {data.pod_running_status}
        </Typography>
      </TableCell>
      {/* <TableCell>{data.pod_status}</TableCell> */}
      <TableCell>{data.priority}</TableCell>
    </TableRow>
  );
}

export default DataTable;
