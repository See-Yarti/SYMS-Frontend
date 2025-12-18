// src/pages/Home.tsx
import React, { useState } from 'react';
import { useAppSelector } from '@/store';
import { useGetUserByEmail } from '@/hooks/useOperatorApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Building2,
  CalendarCheck,
  Car,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Chart component for Daily Revenue Over Time
const RevenueChart: React.FC = () => {
  // Sample data points for the line chart
  const dataPoints = [
    { x: 0, y: 9000 },
    { x: 1, y: 11000 },
    { x: 2, y: 10500 },
    { x: 3, y: 12000 },
    { x: 4, y: 9500 },
    { x: 5, y: 11500 },
    { x: 6, y: 10000 },
    { x: 7, y: 14000 },
    { x: 8, y: 11000 },
    { x: 9, y: 9000 },
    { x: 10, y: 10500 },
    { x: 11, y: 8500 },
  ];

  const maxY = 15000;
  const width = 100;
  const height = 100;

  // Create SVG path
  const pathData = dataPoints
    .map((point, i) => {
      const x = (point.x / 11) * width;
      const y = height - (point.y / maxY) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Create area path (filled)
  const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGradient)" />
      <path d={pathData} fill="none" stroke="#F97316" strokeWidth="0.5" />
      {/* Highlighted point */}
      <circle cx={(7 / 11) * width} cy={height - (14000 / maxY) * height} r="1.5" fill="#F97316" />
      <circle cx={(7 / 11) * width} cy={height - (14000 / maxY) * height} r="2.5" fill="#F97316" fillOpacity="0.3" />
    </svg>
  );
};

// Bar chart for Yearly Bookings Overview
const BookingsBarChart: React.FC = () => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Sample data — replace with API data in real app
  const values = [30, 65, 45, 85, 70, 55, 40, 60, 50, 75, 68, 20];
  const maxValue = 100;

  return (
    <div className="flex items-end justify-between gap-1 h-32 px-2">
      {months.map((month, i) => (
        <div key={month} className="flex flex-col items-center gap-1 flex-1">
          {/* Bar Container */}
          <div className="w-full max-w-[24px] h-28 flex flex-col-reverse justify-end">
            {/* Orange Booking Segment (bottom) */}
            <div
              className="w-full bg-[#F97316] rounded-t"
              style={{ height: `${(values[i] / maxValue) * 100}%` }}
            />
            {/* Light Gray Background Segment (top) */}
            <div
              className="w-full bg-[#E5E7EB] rounded-t"
              style={{ height: `${(maxValue - values[i]) / maxValue * 100}%` }}
            />
          </div>
          {/* Month Label */}
          <span className="text-xs text-muted-foreground">{month}</span>
        </div>
      ))}
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'outlined';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  variant = 'default',
}) => {
  return (
    <Card
      className={cn(
        'p-5 rounded-2xl transition-all',
        variant === 'primary' && 'bg-[#F97316] text-white border-0',
        variant === 'outlined' && 'bg-card border-2 border-[#F97316]',
        variant === 'default' && 'bg-card border border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className='w-10 h-10 rounded-xl flex items-center justify-center'
        >
          <div>
            {icon}
          </div>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-normal px-2 py-1 rounded-full',
            isPositive
              ? variant === 'primary'
                ? 'bg-white/20 text-white'
                : 'text-green-600 dark:text-green-400'
              : variant === 'primary'
                ? 'bg-white/20 text-white'
                : 'text-[#E7000B] dark:text-red-400'
          )}
        >
          {isPositive ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          {change}
        </div>
      </div>
      <div className="mt-4">
        <p
          className={cn(
            'text-sm',
            variant === 'primary' ? 'text-white/80' : 'text-muted-foreground'
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            'text-3xl font-medium mt-1',
            variant === 'primary' ? 'text-white' : 'text-foreground'
          )}
        >
          {value}
        </p>
      </div>
    </Card>
  );
};

// Top Company Item
interface TopCompanyProps {
  rank: number;
  name: string;
  initials: string;
  color: string;
  bookings: number;
  change: string;
}

const TopCompanyItem: React.FC<TopCompanyProps> = ({
  name,
  initials,
  color,
  bookings,
  change,
}) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div
          className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold')}
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <span className="font-medium text-foreground">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-3xl font-medium text-[#F97316]">{bookings}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Total Bookings
          </span>
        </div>
        <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
          <ArrowUp className="w-4 h-4" />
          {change}
        </span>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const [revenueView, setRevenueView] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState('july');

  const email = authUser?.email ?? '';
  const {
    data: userRes,
    isLoading: userLoading,
    isError: userIsError,
    error: userError,
  } = useGetUserByEmail(email);

  const user = userRes?.data?.user;

  // Sample data - in real app, this would come from API
  const stats = {
    totalRevenue: '$102k',
    revenueChange: '+8.2%',
    totalCompanies: '10',
    companiesChange: '+2',
    totalBookings: '102',
    bookingsChange: '+8.2%',
    activeVehicles: '156',
    vehiclesChange: '-3.1%',
  };

  const topCompanies = [
    { name: 'Priceless Ga', initials: 'PG', color: '#EF4444', bookings: 450, change: '+29%' },
    { name: 'Italy Car Rental', initials: 'IC', color: '#3B82F6', bookings: 440, change: '+28%' },
    { name: 'Times Car Rental', initials: 'TC', color: '#10B981', bookings: 410, change: '+27%' },
  ];

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (userIsError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-destructive">
        Error fetching data: {(userError as any)?.message || 'Unknown error'}
      </div>
    );
  }

  const userName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {userName}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening with your platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          change={stats.revenueChange}
          isPositive={true}
          icon={<DollarSign className="w-5 h-5 text-[#F16132]" />}
          variant="default"
        />
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies}
          change={stats.companiesChange}
          isPositive={true}
          icon={<Building2 className="w-5 h-5 text-[#155DFC]" />}
          variant="default"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          change={stats.bookingsChange}
          isPositive={true}
          icon={<CalendarCheck className="w-5 h-5 text-[#9400FF]" />}
          variant="default"
        />
        <StatCard
          title="Active Vehicles"
          value={stats.activeVehicles}
          change={stats.vehiclesChange}
          isPositive={false}
          icon={<Car className="w-5 h-5 text-[#00A63E]" />}
          variant="default"
        />
      </div>

      {/* Daily Revenue Chart */}
      <Card className="p-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Daily Revenue Over Time</h2>
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(['daily', 'monthly', 'yearly'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setRevenueView(view)}
                className={cn(
                  'px-4 py-1.5 text-sm font-normal rounded-md transition-colors capitalize',
                  revenueView === view
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {/* Y-axis labels and chart */}
        <div className="flex gap-4">
          <div className="flex flex-col justify-between text-xs text-muted-foreground py-2">
            <span>$15000</span>
            <span>$12000</span>
            <span>$9000</span>
            <span>$6000</span>
            <span>$3000</span>
            <span>$0</span>
          </div>
          <div className="flex-1 h-64 relative">
            <RevenueChart />
            {/* Tooltip */}
            <div className="absolute top-8 right-1/3 bg-[#F97316] text-white px-3 py-2 rounded-lg text-sm shadow-lg">
              <div className="text-xs opacity-80">Jan 30</div>
              <div className="font-semibold">$14,032.56</div>
            </div>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between ml-12 mt-2 text-xs text-muted-foreground">
          <span>12 pm</span>
          <span>12 pm</span>
          <span>12 pm</span>
          <span>12 pm</span>
          <span>11 am</span>
          <span>10 am</span>
        </div>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Top Companies */}
        <Card className="p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Monthly Top Companies</h2>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[100px] h-9 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="january">January</SelectItem>
                <SelectItem value="february">February</SelectItem>
                <SelectItem value="march">March</SelectItem>
                <SelectItem value="april">April</SelectItem>
                <SelectItem value="may">May</SelectItem>
                <SelectItem value="june">June</SelectItem>
                <SelectItem value="july">July</SelectItem>
                <SelectItem value="august">August</SelectItem>
                <SelectItem value="september">September</SelectItem>
                <SelectItem value="october">October</SelectItem>
                <SelectItem value="november">November</SelectItem>
                <SelectItem value="december">December</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-border">
            {topCompanies.map((company, index) => (
              <TopCompanyItem
                key={company.name}
                rank={index + 1}
                name={company.name}
                initials={company.initials}
                color={company.color}
                bookings={company.bookings}
                change={company.change}
              />
            ))}
          </div>
        </Card>

        {/* Yearly Bookings Overview */}
        <Card className="p-6 rounded-2xl border border-border bg-card">
          <h2 className="text-xl font-semibold text-foreground mb-16">Yearly Bookings Overview</h2>
          <BookingsBarChart />
        </Card>
      </div>
    </div>
  );
};

export default Home;