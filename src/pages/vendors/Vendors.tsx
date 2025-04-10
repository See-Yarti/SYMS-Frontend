import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogActions, DialogContent, DialogTitle, Avatar, Switch, Typography, Box, TextField } from '@mui/material';
import { Visibility as VisibilityIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import { fetchVendors, fetchVendorById, deleteVendor } from '../../lib/vendor';
import { usePostData } from '@/hooks/useApi';
import PasswordDialog from '@/components/Dialog/PasswordDialog';

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string;
    phoneNumber: string;
    gender: string;
};

type Vendor = {
    id: string;
    user?: User; // Made optional since detail response doesn't include it
    companyName: string;
    companyAddress: string;
    vendorState: string;
    isVendorVerified: boolean;
    designation?: string;
    taxRefNumber?: string;
    tradeLicense?: string;
    isDummyPassword?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

const VendorTable: React.FC = () => {
    const [openDetail, setOpenDetail] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [vendorList, setVendorList] = useState<Vendor[]>([]);
    const [confirmationName, setConfirmationName] = useState('');

    const { mutate: verifyVendor } = usePostData<{ vendorId: string; newPassword: string }>('/vendor/verify');

    useEffect(() => {
        const loadVendors = async () => {
            try {
                const response = await fetchVendors();
                setVendorList(response.data || []);
            } catch (error) {
                console.log(error);
                toast.error('Failed to fetch vendors');
                setVendorList([]);
            }
        };

        loadVendors();
    }, []);

    const handleClickOpen = async (vendorId: string) => {
        try {
            const response = await fetchVendorById(vendorId);
            // Find the full vendor data from the list to get user info
            const fullVendorData = vendorList.find(v => v.id === vendorId);
            setSelectedVendor({
                ...response.data,
                user: fullVendorData?.user // Merge user data from list with detail response
            });
            setOpenDetail(true);
        } catch (error) {
            console.log(error);
            toast.error('Failed to fetch vendor details');
        }
    };

    const handleClose = () => {
        setOpenDetail(false);
        setSelectedVendor(null);
    };

    const handleDeleteOpen = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setOpenDeleteDialog(true);
    };

    const handleDeleteClose = () => {
        setOpenDeleteDialog(false);
        setConfirmationName('');
    };

    const handleStatusChange = (id: string) => {
        setSelectedVendor(vendorList.find(vendor => vendor.id === id) || null);
        setOpenPasswordDialog(true);
    };

    const handlePasswordSubmit = async (newPassword: string) => {
        if (!selectedVendor) return;

        if (typeof selectedVendor.id !== 'string' || selectedVendor.id.trim() === '') {
            toast.error('Invalid vendor ID');
            return;
        }
        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        try {
            verifyVendor(
                { vendorId: selectedVendor.id, newPassword },
                {
                    onSuccess: () => {
                        setVendorList(vendorList.map(vendor => vendor.id === selectedVendor.id ? { ...vendor, isVendorVerified: true } : vendor));
                        toast.success('Vendor verified successfully');
                        setOpenPasswordDialog(false);
                    },
                    onError: () => {
                        toast.error('Failed to verify vendor');
                    },
                }
            );
        } catch (error) {
            console.log(error);
            toast.error('Failed to verify vendor');
        }
    };



    const handleDelete = async () => {
        if (!selectedVendor) return;

        if (confirmationName === selectedVendor.user?.name) {
            try {
                await deleteVendor(selectedVendor.id);
                setVendorList(vendorList.filter(vendor => vendor.id !== selectedVendor.id));
                setOpenDeleteDialog(false);
                setConfirmationName('');
                toast.success('Vendor was deleted');
            } catch (error) {
                console.log(error);
                toast.error('Failed to delete vendor');
            }
        } else {
            toast.error("The name doesn't match. Vendor was not deleted.");
        }
    };

    return (
        <div className="p-6 bg-sidebar rounded-lg shadow-lg text-sidebar-foreground">
            <TableContainer className="overflow-hidden">
                <Table>
                    <TableHead>
                        <TableRow >
                            <TableCell>Avatar</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Company Name</TableCell>
                            <TableCell>Company Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vendorList && vendorList.length > 0 ? (
                            vendorList.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell>
                                        <Avatar
                                            src={vendor.user?.avatarUrl || `https://ui-avatars.com/api/?name=${vendor.user?.name || 'V'}`}
                                            alt={vendor.user?.name || 'Vendor'}
                                        />
                                    </TableCell>
                                    <TableCell>{vendor.user?.name || 'N/A'}</TableCell>
                                    <TableCell>{vendor.companyName}</TableCell>
                                    <TableCell>{vendor.user?.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={vendor.isVendorVerified}
                                            onChange={() => handleStatusChange(vendor.id)}
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => handleClickOpen(vendor.id)}
                                            startIcon={<VisibilityIcon />}
                                        >
                                            View Detail
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleDeleteOpen(vendor)}
                                            startIcon={<DeleteIcon />}
                                            sx={{ marginLeft: '8px' }}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No vendor data found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Vendor Detail Dialog */}
            <Dialog open={openDetail} onClose={handleClose}>
                <DialogTitle>Vendor Detail</DialogTitle>
                <DialogContent>
                    {selectedVendor && (
                        <Box className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Avatar
                                    src={selectedVendor.user?.avatarUrl || `https://ui-avatars.com/api/?name=${selectedVendor.user?.name || 'V'}`}
                                    sx={{ width: 56, height: 56 }}
                                />
                                <div>
                                    <Typography variant="h6">{selectedVendor.user?.name || 'N/A'}</Typography>
                                    <Typography variant="body2">{selectedVendor.designation || 'N/A'}</Typography>
                                </div>
                            </div>
                            <Typography><strong>Company Name:</strong> {selectedVendor.companyName || 'N/A'}</Typography>
                            <Typography><strong>Company Email:</strong> {selectedVendor.user?.email || 'N/A'}</Typography>
                            <Typography><strong>Company Address:</strong> {selectedVendor.companyAddress || 'N/A'}</Typography>
                            <Typography><strong>Vendor State:</strong> {selectedVendor.vendorState || 'N/A'}</Typography>
                            {selectedVendor.taxRefNumber && (
                                <Typography>
                                    <strong>Tax Reference Number:</strong>
                                    <a
                                        href={selectedVendor.taxRefNumber}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'blue', textDecoration: 'underline', marginLeft: '8px' }}
                                    >
                                        View Tax Reference
                                    </a>
                                </Typography>
                            )}
                            {selectedVendor.tradeLicense && (
                                <Typography>
                                    <strong>Trade License: </strong>
                                    <a
                                        href={selectedVendor.tradeLicense}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'blue', textDecoration: 'underline', marginLeft: '8px' }}
                                    >
                                        View Trade License
                                    </a>
                                </Typography>
                            )}
                            <Typography>
                                <strong>Status:</strong> {selectedVendor.isVendorVerified ? 'Verified' : 'Not Verified'}
                            </Typography>
                            <Typography>
                                <strong>Created At:</strong> {selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleString() : 'N/A'}
                            </Typography>
                            <Typography>
                                <strong>Updated At:</strong> {selectedVendor.updatedAt ? new Date(selectedVendor.updatedAt).toLocaleString() : 'N/A'}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">Close</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleDeleteClose}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>To confirm deletion, please type the vendor name "{selectedVendor?.user?.name || ''}"</Typography>
                    <TextField
                        fullWidth
                        value={confirmationName}
                        onChange={(e) => setConfirmationName(e.target.value)}
                        variant="outlined"
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose} color="primary">Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Password Dialog */}
            <PasswordDialog
                open={openPasswordDialog}
                onClose={() => setOpenPasswordDialog(false)}
                onSubmit={handlePasswordSubmit}
            />
        </div>
    );
};

export default VendorTable;