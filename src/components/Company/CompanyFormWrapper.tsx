// src/components/CompanyFormWrapper.tsx
import { useState } from 'react';
import CompanyForm from '@/pages/company/CompanyForm';

const CompanyFormWrapper = () => {
  const [currentStep, setCurrentStep] = useState(1);
  
  return (
    <CompanyForm 
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
    />
  );
};

export default CompanyFormWrapper;