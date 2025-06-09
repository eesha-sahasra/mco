import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";

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

const VersionUpdateModal = ({ open, onContinue, onIgnore, message }) => {
    return (
        <Modal open={open}>
            <Box sx={popupStyle}>
                <Typography variant="h6" component="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {message}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onContinue}
                    >
                        Update
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={onIgnore} // Trigger game start logic on "Ignore"
                    >
                        Ignore
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default VersionUpdateModal;
