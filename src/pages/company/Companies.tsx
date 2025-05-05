// src/pages/Companies.tsx
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Plus, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';

const Companies = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Steps for the stepper
  const steps = [
    'Operator Information',
    'Company Details',
    'Documents & Verification'
  ];

  // Determine active tab based on current route
  const getActiveTab = useCallback(() => {
    if (location.pathname.includes('companies/list')) return 'list';
    if (location.pathname.match(/\/companies\/[^/]+$/)) return 'details';
    if (location.pathname.includes('companies/new')) return 'new';
    if (location.pathname === '/companies') return 'list';
    return 'list';
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Sync tab state with URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname, getActiveTab]);

  // If user lands on /companies, redirect to /companies/list
  if (location.pathname === '/companies') {
    return <Navigate to="/companies/list" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {(activeTab === 'details' || activeTab === 'new') && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => navigate('/companies/list')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Companies Management</h1>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'list' && 'View and manage all registered companies'}
              {activeTab === 'details' && 'Viewing company details'}
              {activeTab === 'new' && 'Register a new company'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'list' && (
            <Button asChild>
              <Link to="/companies/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Company
              </Link>
            </Button>
          )}
          {(activeTab === 'details' || activeTab === 'new') && (
            <Button
              variant="secondary"
              onClick={() => navigate('/companies/list')}
              className="hidden md:flex"
            >
              Back to All Companies
            </Button>
          )}
          <Button
            variant={activeTab === 'list' ? 'secondary' : 'default'}
            onClick={() =>
              activeTab === 'list'
                ? navigate('/companies')
                : navigate('/companies/list')
            }
            className="md:hidden"
          >
            {activeTab === 'list' ? 'Details' : 'List'}
          </Button>
        </div>
      </div>

      {/* Stepper for new company form */}
      {activeTab === 'new' && (
        <div className="space-y-6">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            className="max-w-3xl mx-auto"
          />
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <h2 className="text-xl font-semibold text-primary">
                {steps[currentStep - 1]}
              </h2>
            </CardHeader>
            <CardContent>
              <Outlet context={{ currentStep, setCurrentStep }} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Regular content for list and detail views */}
      {activeTab !== 'new' && (
        <div className="pt-2">
          <Outlet />
        </div>
      )}
    </div>
  );
};

export default Companies;