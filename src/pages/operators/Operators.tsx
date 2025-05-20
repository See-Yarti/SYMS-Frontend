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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useGetAllOperators, useDeleteOperator } from '@/hooks/useOperatorApi';
import { Operator } from '@/types/company';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store';

const OperatorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [confirmationName, setConfirmationName] = useState('');

  const { user } = useAppSelector((state) => state.auth);

  const {
    data: allOperators,
    isLoading: isOperatorsLoading,
    error: operatorsError,
    refetch: refetchOperators,
  } = useGetAllOperators();

  const { mutate: deleteOperator } = useDeleteOperator();

  const isAdmin = user?.role === 'admin';

  // Filter operators based on role
  const operators = isAdmin
    ? allOperators
    : allOperators?.filter(op => ['adminOperator', 'managerOperator', 'salesOperator'].includes(op.operatorRole));

  const handleRegisterClick = () => {
    navigate('/operators/register');
  };

  const handleDeleteOpen = (operator: Operator) => {
    setSelectedOperator(operator);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
    setConfirmationName('');
  };

  const handleDelete = () => {
    if (!selectedOperator) return;

    if (confirmationName === selectedOperator.user.name) {
      deleteOperator(selectedOperator.id, {
        onSuccess: () => {
          toast.success('Operator deleted successfully');
          refetchOperators();
          setOpenDeleteDialog(false);
          setConfirmationName('');
        },
        onError: (error) => {
          console.error('Delete error:', error);
          toast.error('Failed to delete operator');
        },
      });
    } else {
      toast.error("The name doesn't match. Operator was not deleted.");
    }
  };
  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      adminOperator: { label: 'User', variant: 'default' },
      managerOperator: { label: 'Manager', variant: 'secondary' },
      salesOperator: { label: 'Sales', variant: 'outline' },
    };

    const roleInfo = roleMap[role] || { label: role, variant: 'outline' };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  if (isOperatorsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[250px]" />
          {!isAdmin && <Skeleton className="h-10 w-[200px]" />}
        </div>
        <div className="rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(6)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-[80%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (operatorsError) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Operators Management</h1>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          Error loading operators. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {isAdmin ? 'All Operators' : 'Company Operators'}
        </h1>
        {!isAdmin && (
          <Button onClick={handleRegisterClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Register New Operator
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last Activity</TableHead>
              {!isAdmin && <TableHead className="w-[150px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {operators && operators.length > 0 ? (
              operators.map((operator) => (
                <TableRow key={operator.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={operator.user.avatar || undefined}
                        alt={operator.user.name}
                      />
                      <AvatarFallback>
                        {operator.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {operator.user.name}
                      {operator.user.isFirstLogin && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>First login not completed</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {operator.user.email}
                  </TableCell>
                  <TableCell>{getRoleBadge(operator.operatorRole)}</TableCell>
                  <TableCell>
                    {new Date(operator.user.lastActivityAt).toLocaleString()}
                  </TableCell>
                  {!isAdmin && (
                    <TableCell>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOperator(operator);
                                  setOpenDetail(true);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive border-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteOpen(operator)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete operator</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 6} className="h-24 text-center">
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
                  <AvatarImage
                    src={selectedOperator.user.avatar || undefined}
                    alt={selectedOperator.user.name}
                  />
                  <AvatarFallback>
                    {selectedOperator.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedOperator.user.name}</h3>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(selectedOperator.operatorRole)}
                    {selectedOperator.user.isFirstLogin && (
                      <Badge variant="outline" className="text-yellow-600">
                        Pending First Login
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-bold">Email</Label>
                    <p>{selectedOperator.user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold">Phone Number</Label>
                    <p>{selectedOperator.user.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-bold">Gender</Label>
                    <p className="capitalize">
                      {selectedOperator.user.gender || 'Not specified'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold">Status</Label>
                    <p>
                      {selectedOperator.user.isFirstLogin
                        ? 'Pending First Login'
                        : 'Active'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-bold">Last Login</Label>
                    <p>{new Date(selectedOperator.user.lastLoginAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold">Last Activity</Label>
                    <p>
                      {new Date(selectedOperator.user.lastActivityAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedOperator.company && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Company Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="font-bold">Company Name</Label>
                        <p>{selectedOperator.company.name}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="font-bold">Status</Label>
                        <Badge
                          variant={selectedOperator.company.isVerified ? 'default' : 'outline'}
                        >
                          {selectedOperator.company.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
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
              This action cannot be undone. Please type{' '}
              <span className="font-semibold">"{selectedOperator?.user.name || ''}"</span>{' '}
              to confirm.
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
                placeholder="Type the operator's name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmationName !== selectedOperator?.user.name}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperatorsPage;