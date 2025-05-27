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
import { useDebounce } from 'use-debounce';
import { ChevronsUpDown, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';


const OperatorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [confirmationName, setConfirmationName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [limit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  // Our ONLY operator query!
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetAllOperators({
    search: debouncedSearchTerm,
    operatorRole: selectedRole,
    sortBy,
    sortOrder,
    limit,
    page,
  });

  const { mutate: deleteOperator } = useDeleteOperator();

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'adminOperator', label: 'User' },
    { value: 'managerOperator', label: 'Manager' },
    { value: 'salesOperator', label: 'Sales' },
    { value: 'accountantOperator', label: 'Accountant' },
  ];

  // Safe fallback for no data
  const operators = data?.operators || [];
  const total = data?.total || 0;

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
          refetch();
          setOpenDeleteDialog(false);
          setConfirmationName('');
        },
        onError: (error: any) => {
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
      accountantOperator: { label: 'Accountant', variant: 'outline' },
    };

    const roleInfo = roleMap[role] || { label: role, variant: 'outline' };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-10 w-[200px]" />
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

  if (error) {
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute left-3 top-3 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {!isAdmin && (
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead
                className="cursor-pointer select-none flex items-center gap-2"
                onClick={() => {
                  setSortBy('name');
                  setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                }}
              >
                Name
                {sortBy === 'name' ? (
                  sortOrder === 'ASC' ? (
                    <ArrowUpAZ className="inline-block w-4 h-4" />
                  ) : (
                    <ArrowDownAZ className="inline-block w-4 h-4" />
                  )
                ) : (
                  <ChevronsUpDown className="inline-block w-4 h-4 text-muted-foreground" />
                )}
              </TableHead>

              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
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
      {/* Pagination Controls */}
      <div className="flex items-center gap-4 mt-4">
        <Button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          variant="outline"
        >
          Prev
        </Button>
        <span>
          Page {page} of {Math.ceil(total / limit)}
        </span>
        <Button
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(total / limit)}
          variant="outline"
        >
          Next
        </Button>
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
