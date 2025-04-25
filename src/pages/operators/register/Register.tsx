// src/pages/operators/register/Register.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/ui/stepper';
import React, { useState } from 'react';
import RegisterForm from './Register-Form';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const steps = ['Basic Information', 'Company Details', 'Documents'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <Label className="text-3xl font-bold">Operator Registration</Label>
        <p className="text-muted-foreground">
          Complete the form below to register a new operator
        </p>
      </div>

      <Stepper 
        steps={steps} 
        currentStep={currentStep} 
        className="mb-8"
      />

      <Card className="shadow-lg">
        <CardHeader>
          <h2 className="text-xl font-semibold">
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
    </div>
  );
};

export default Register;