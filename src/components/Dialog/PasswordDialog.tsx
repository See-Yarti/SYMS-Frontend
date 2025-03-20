import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

type PasswordDialogProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (password: string) => void;
};

const PasswordDialog: React.FC<PasswordDialogProps> = ({ open, onClose, onSubmit }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
        onSubmit(password);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Set Password</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} color="primary">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PasswordDialog;