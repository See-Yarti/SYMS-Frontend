// src/pages/operators/register/Register.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/ui/stepper';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from './Register-Form';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const steps = ['Operator Details', 'Company Information', 'Documents & Verification'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-8 bg-white">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Logo with improved styling */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <img
            src="/images/logo.svg"
            width="200"
            height="200"
            alt="Company Logo"
            className="rounded-lg shadow-sm"
          />
        </div>

        <div className="space-y-2 text-center">
          <Label className="text-3xl font-bold bg-yellow-400 bg-clip-text text-transparent">
            Company Registration
          </Label>
          <p className="text-muted-foreground text-lg">
            Complete the form below to register a new operator account
          </p>
        </div>
      </div>

      <Stepper
        steps={steps}
        currentStep={currentStep}
        className="mb-8 max-w-3xl mx-auto"
      />

      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <h2 className="text-xl font-semibold text-primary">
            {steps[currentStep - 1]}
          </h2>
        </CardHeader>
        <CardContent>
          <RegisterForm
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        </CardContent>
      </Card>
      <div className="flex items-center justify-center w-full my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="px-4 text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="mt-6 flex justify-center items-center">
        <p className="text-sm text-gray-500">
          Have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-gray-600 hover:text-gray-800"
          >
            Login now
          </Link>
        </p>
      </div>

    </div>
  );
};
export default Register;