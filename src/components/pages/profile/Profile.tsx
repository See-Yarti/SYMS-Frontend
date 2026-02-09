'use client';

// src/pages/profile/Profile.tsx
import { useAppSelector } from '@/store';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@/hooks/useNextNavigation';
import {
  Mail,
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Users,
  Briefcase,
  Shield,
  Award,
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // Mock data for the profile - replace with real API data
  const profileData = {
    name: user?.name || 'Rizwan Ahmed',
    email: user?.email || 'rizwan@yalaride.com',
    phone: user?.phoneNumber || '+1 (407) 779-4604',
    role: 'Administrator',
    department: 'Operations',
    location: 'Orlando, Florida',
    memberSince: 'Jan 2023',
    bio: 'Experienced administrator managing fleet operations and customer relations. Dedicated to ensuring smooth operations and excellent service delivery across all departments. Specializing in team coordination,resource management, and strategic planning.',
    stats: {
      totalBookings: '1,247',
      activeUsers: '342',
      revenue: '$52.4K',
      completed: '98%',
    },
    recentActivity: [
      { action: 'Updated user permissions', time: '2 hours ago' },
      { action: 'Approved new booking request', time: '5 hours ago' },
      { action: 'Modified car class pricing', time: '1 day ago' },
      { action: 'Added new company profile', time: '2 days ago' },
    ],
    permissions: [
      'Manage Users',
      'Edit Settings',
      'View Reports',
      'Manage Bookings',
      'Full System Access',
    ],
    accountStatus: {
      status: 'Active',
      verification: 'Verified',
      lastLogin: '2 hours ago',
      department: 'Operations',
    },
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user)
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        Loading user data...
      </div>
    );

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Profile
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Profile - View and manage your profile information
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#000000] dark:bg-[#000000] rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white flex items-center justify-center text-[#FE6603] text-2xl sm:text-5xl font-normal">
                {getInitials(profileData.name)}
              </div>
              <span className="absolute top-0 right-0 sm:top-1 sm:right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-green-500 border-2 border-[#1a1a2e]" />
            </div>

            {/* Info */}
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-medium">
                {profileData.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-white/80 text-sm">
                <span className="font-normal">{profileData.role}</span>
                <span className="hidden sm:inline">•</span>
                <span>{profileData.department}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">
                    Member since {profileData.memberSince}
                  </span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 sm:gap-4 lg:gap-6 text-white/70 text-xs sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate max-w-[200px] sm:max-w-none">
                    {profileData.email}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {profileData.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {profileData.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <Button
            variant="outline"
            className="bg-[#FFFFFF] text-sm sm:text-base font-semibold text-[#F56304] hover:text-[#F56303] mt-10 md:mt-6 w-full sm:w-[148px] md:h-11"
            onClick={() => navigate('/settings/profile')}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Bookings */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-normal text-foreground truncate">
              {profileData.stats.totalBookings}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Total Bookings
            </p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-[#00C950] flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-normal text-foreground truncate">
              {profileData.stats.activeUsers}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Active Users
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-[#AD46FF] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-normal text-foreground truncate">
              {profileData.stats.revenue}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Revenue
            </p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-[#FF6900] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-normal text-foreground truncate">
              {profileData.stats.completed}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Completed
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Bio and Activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Bio Section */}
          <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
            <h3 className="text-base sm:text-lg font-normal text-foreground mb-2 sm:mb-3">
              Bio
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {profileData.bio}
            </p>

            {/* Recent Activity */}
            <div className="mt-8 mb-4">
              <h3 className="text-base sm:text-lg font-normal text-foreground mb-3 sm:mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {profileData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3">
                    <div className="mt-1.5 sm:mt-1">
                      <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-orange-500 block" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-normal text-sm sm:text-base text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Role & Account Status */}
        <div className="space-y-4 sm:space-y-6">
          {/* Role & Permissions */}
          <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#FF6900] dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-normal text-sm sm:text-base text-foreground truncate">
                  Administrator
                </p>
              </div>
              <span className="px-2 sm:px-3 py-1 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-normal whitespace-nowrap">
                Full Access
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              You have complete control over the system including user
              management, settings, and all data.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Manage Users</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Edit Settings</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>View Reports</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Manage Bookings</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground sm:col-span-2">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Full System Access</span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
            <h3 className="text-sm sm:text-base font-normal text-foreground mb-3 sm:mb-4">
              Account Status
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Status
                </span>
                <span className="flex items-center gap-1.5 text-[#00C950] font-normal text-xs sm:text-sm">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Verification
                </span>
                <span className="flex items-center gap-1.5 text-[#155DFC] font-normal text-xs sm:text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Last Login
                </span>
                <span className="text-xs sm:text-sm text-foreground font-normal">
                  2 hours ago
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Department
                </span>
                <span className="text-xs sm:text-sm text-foreground font-normal">
                  Operations
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
