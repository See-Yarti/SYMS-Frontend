// src/pages/operators/OperatorProfile.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetOperator, useUpdateOperator, useChangeOperatorRole } from '@/hooks/useApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const OperatorProfile: React.FC = () => {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const { data: operator, isLoading, error } = useGetOperator(operatorId || '');
  const { mutate: updateOperator, isPending: isUpdating } = useUpdateOperator();
  const { mutate: changeRole, isPending: isChangingRole } = useChangeOperatorRole();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    gender: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState('');

  React.useEffect(() => {
    if (operator) {
      setFormData({
        name: operator.user.name,
        phoneNumber: operator.user.phoneNumber,
        gender: operator.user.gender,
      });
      setNewRole(operator.operatorRole);
    }
  }, [operator]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!operatorId) return;

    updateOperator({
      operatorId,
      payload: {
        ...formData,
        avatar: avatarFile || undefined,
      }
    }, {
      onSuccess: () => {
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        console.error('Update error:', error);
        toast.error(error.message || 'Failed to update profile');
      },
    });
  };

  const handleRoleChange = () => {
    if (!operatorId || !newRole) return;

    changeRole({
      operatorId,
      operatorRole: newRole,
      companyId: operator?.company.id || ''
    }, {
      onSuccess: () => {
        toast.success('Role updated successfully');
        setShowRoleDialog(false);
      },
      onError: (error) => {
        console.error('Role change error:', error);
        toast.error(error.message || 'Failed to update role');
      }
    });
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      adminOperator: { label: 'Admin', variant: 'default' },
      managerOperator: { label: 'Manager', variant: 'secondary' },
      salesOperator: { label: 'Sales', variant: 'outline' },
      supportOperator: { label: 'Support', variant: 'outline' },
    };

    const roleInfo = roleMap[role] || { label: role, variant: 'outline' };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          Error loading operator profile. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/operators')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Operator Profile</h1>
        </div>

        {operator.operatorRole !== 'adminOperator' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
                Change Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={avatarFile ? URL.createObjectURL(avatarFile) : operator.user.avatar || undefined}
              alt={operator.user.name}
            />
            <AvatarFallback>{operator.user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Label
            htmlFor="avatar"
            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90"
          >
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Label>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{operator.user.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {getRoleBadge(operator.operatorRole)}
            {operator.user.isFirstLogin && (
              <Badge variant="outline" className="text-yellow-600">
                Pending First Login
              </Badge>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">
            Gender
          </Label>
          <Select
            value={formData.gender}
            onValueChange={handleGenderChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/operators')}
          >
            Back
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {operator.company && (
        <div className="mt-12 pt-6 border-t">
          <h3 className="font-medium mb-4">Company Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-bold">Company Name</Label>
              <p>{operator.company.name}</p>
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Status</Label>
              <Badge variant={operator.company.isVerified ? 'default' : 'outline'}>
                {operator.company.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Trade License</Label>
              <a
                href={operator.company.tradeLicenseFile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                View License
              </a>
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Tax File</Label>
              <a
                href={operator.company.taxFile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                View Tax File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Operator Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="flex items-center gap-2">
                {getRoleBadge(operator.operatorRole)}
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="managerOperator">Manager Operator</SelectItem>
                  <SelectItem value="salesOperator">Sales Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={isChangingRole || newRole === operator.operatorRole}
            >
              {isChangingRole ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperatorProfile;