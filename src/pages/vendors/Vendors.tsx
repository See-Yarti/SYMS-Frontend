import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogActions, DialogContent, DialogTitle, Avatar, Switch, Typography, Box, TextField } from '@mui/material';
import { Visibility as VisibilityIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import { fetchVendors, fetchVendorById, deleteVendor } from '../../lib/vendor';
import { usePostData } from '@/hooks/useApi';
import PasswordDialog from '@/components/Dialog/PasswordDialog';

type Vendor = {
    id: string;
    user: {
        name: string;
        email: string;
    };
    companyName: string;
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

    const { mutate: verifyVendor } = usePostData('/vendor/:id/verify');

    useEffect(() => {
        const loadVendors = async () => {
            try {
                const response = await fetchVendors();
                setVendorList(response.data.vendors);
            } catch (error) {
                console.log(error);
                toast.error('Failed to fetch vendors');
            }
        };

        loadVendors();
    }, []);

    const handleClickOpen = async (vendorId: string) => {
        try {
            const response = await fetchVendorById(vendorId);
            setSelectedVendor(response.data);
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

    const handlePasswordSubmit = async (password: string) => {
        if (!selectedVendor) return;
      
        try {
          await verifyVendor(
            { id: selectedVendor.id, password }, // Pass id and password
            {
              onSuccess: () => {
                setVendorList(vendorList.map(vendor =>
                  vendor.id === selectedVendor.id ? { ...vendor, isVendorVerified: true } : vendor
                ));
                toast.success('Vendor verified successfully');
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
        if (confirmationName === selectedVendor?.user.name) {
            try {
                await deleteVendor(selectedVendor.id);
                setVendorList(vendorList.filter(vendor => vendor.id !== selectedVendor?.id));
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
                        <TableRow>
                            <TableCell>Avatar</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Company Name</TableCell>
                            <TableCell>Company Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vendorList.map((vendor) => (
                            <TableRow key={vendor.id}>
                                <TableCell>
                                    <Avatar src={`https://ui-avatars.com/api/?name=${vendor.user.name}`} alt={vendor.user.name} />
                                </TableCell>
                                <TableCell>{vendor.user.name}</TableCell>
                                <TableCell>{vendor.companyName}</TableCell>
                                <TableCell>{vendor.user.email}</TableCell>
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
                        ))}
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
                                <Avatar src={`https://ui-avatars.com/api/?name=${selectedVendor.user.name}`} sx={{ width: 56, height: 56 }} />
                                <div>
                                    <Typography variant="h6">{selectedVendor.user.name}</Typography>
                                    <Typography variant="body2">{selectedVendor.designation}</Typography>
                                </div>
                            </div>
                            <Typography><strong>Company Name:</strong> {selectedVendor.companyName}</Typography>
                            <Typography><strong>Company Email:</strong> {selectedVendor.user.email}</Typography>
                            <Typography><strong>Tax Reference Number:</strong> {selectedVendor.taxRefNumber}</Typography>
                            <Typography>
                                <strong>Trade License: </strong>
                                <a
                                    href={selectedVendor.tradeLicense}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'blue', textDecoration: 'underline' }}
                                >
                                    View Trade License
                                </a>
                            </Typography>
                            <Typography>
                                <strong>Created At:</strong> {selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleString() : ''}
                            </Typography>
                            <Typography>
                                <strong>Updated At:</strong> {selectedVendor.updatedAt ? new Date(selectedVendor.updatedAt).toLocaleString() : ''}
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
                    <Typography>To confirm deletion, please type the vendor name "{selectedVendor?.user.name}"</Typography>
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