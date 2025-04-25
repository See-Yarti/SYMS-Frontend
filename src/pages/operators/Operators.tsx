// src/pages/operators/Operators.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useFetchData, usePostData, useDeleteVendor } from '@/hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  phoneNumber: string;
  gender: string;
};

type Operator = {
  id: string;
  user?: User;
  companyName: string;
  companyAddress: string;
  operatorState: string;
  isOperatorVerified: boolean;
  designation?: string;
  taxRefNumber?: string;
  tradeLicense?: string;
  isDummyPassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const OperatorTable: React.FC = () => {
  const navigate = useNavigate();
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [confirmationName, setConfirmationName] = useState('');
  const [password, setPassword] = useState('');

  const {
    data: operatorsData,
    isLoading: isOperatorsLoading,
    error: operatorsError,
    refetch: refetchOperators
  } = useFetchData('/vendor', 'operators');

  const { mutate: verifyOperator } = usePostData<{ operatorId: string; newPassword: string }>('/vendor/verify');
  const { mutate: deleteOperator } = useDeleteVendor();

  const operatorList = operatorsData?.data || [];

  const handleRegisterClick = () => {
    navigate('/operatorsregister');
  };

  const handleDeleteOpen = (operator: Operator) => {
    setSelectedOperator(operator);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
    setConfirmationName('');
  };

  const handleStatusChange = (operator: Operator) => {
    setSelectedOperator(operator);
    setOpenPasswordDialog(true);
  };

  const handlePasswordSubmit = async () => {
    if (!selectedOperator) return;

    if (typeof selectedOperator.id !== 'string' || selectedOperator.id.trim() === '') {
      toast.error('Invalid operator ID');
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    verifyOperator(
      { operatorId: selectedOperator.id, newPassword: password },
      {
        onSuccess: () => {
          toast.success('Operator verified successfully');
          refetchOperators();
          setOpenPasswordDialog(false);
          setPassword('');
        },
        onError: () => {
          toast.error('Failed to verify Operator');
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!selectedOperator) return;

    if (confirmationName === selectedOperator.user?.name) {
      deleteOperator(selectedOperator.id, {
        onSuccess: () => {
          toast.success('Operator was deleted');
          refetchOperators();
          setOpenDeleteDialog(false);
          setConfirmationName('');
        },
        onError: (error) => {
          console.error('Delete error:', error);
          toast.error('Failed to delete Operator');
        },
      });
    } else {
      toast.error("The name doesn't match. Operator was not deleted.");
    }
  };

  if (isOperatorsLoading) {
    return <div className="p-4">Loading operators...</div>;
  }

  if (operatorsError) {
    return <div className="p-4 text-destructive">Error loading operators</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Operators Management</h1>
        <Button onClick={handleRegisterClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Register New Operator
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operatorList && operatorList.length > 0 ? (
              operatorList.map((operator: Operator) => (
                <TableRow key={operator.id}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={operator.user?.avatarUrl || `https://ui-avatars.com/api/?name=${operator.user?.name || 'O'}`} />
                      <AvatarFallback>{operator.user?.name?.charAt(0) || 'O'}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{operator.user?.name || 'N/A'}</TableCell>
                  <TableCell>{operator.companyName}</TableCell>
                  <TableCell className="text-muted-foreground">{operator.user?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={operator.isOperatorVerified}
                        onCheckedChange={() => handleStatusChange(operator)}
                        disabled={operator.isOperatorVerified}
                      />
                      <span className="text-sm">
                        {operator.isOperatorVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOperator(operator);
                          setOpenDetail(true);
                        }}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive border-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteOpen(operator)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No operators found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Operator Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Operator Details</DialogTitle>
          </DialogHeader>
          {selectedOperator && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedOperator.user?.avatarUrl || `https://ui-avatars.com/api/?name=${selectedOperator.user?.name || 'O'}`} />
                  <AvatarFallback>{selectedOperator.user?.name?.charAt(0) || 'O'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedOperator.user?.name || 'N/A'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOperator.designation || 'N/A'}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <p>{selectedOperator.companyName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{selectedOperator.user?.email || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <Label>Company Address</Label>
                  <p>{selectedOperator.companyAddress || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Emirate</Label>
                    <p>{selectedOperator.operatorState || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p>{selectedOperator.isOperatorVerified ? 'Verified' : 'Pending Verification'}</p>
                  </div>
                </div>

                {selectedOperator.taxRefNumber && (
                  <div>
                    <Label>Tax Reference : </Label>
                    <a
                      href={selectedOperator.taxRefNumber}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      View Tax Reference
                    </a>
                  </div>
                )}

                {selectedOperator.tradeLicense && (
                  <div>
                    <Label>Trade License : </Label>
                    <a
                      href={selectedOperator.tradeLicense}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      View Trade License
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created At</Label>
                    <p>{selectedOperator.createdAt ? new Date(selectedOperator.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Updated At</Label>
                    <p>{selectedOperator.updatedAt ? new Date(selectedOperator.updatedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please type <span className="font-semibold">"{selectedOperator?.user?.name || ''}"</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmationName" className="text-right">
                Name
              </Label>
              <Input
                id="confirmationName"
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Verification Password</DialogTitle>
            <DialogDescription>
              Set a password for {selectedOperator?.user?.name || 'this operator'} to verify their account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder="Enter at least 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Verify Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperatorTable;