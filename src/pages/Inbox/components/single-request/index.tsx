import React from 'react';
import RequestView from './view';
import { TCurrentRequestStep } from '@/redux/features/request/types';
import { useAppSelector } from '@/redux';
import RejectRequest from './reject';

const stepComponents: Record<TCurrentRequestStep, React.FC> = {
  view: RequestView,
  reject: RejectRequest,
};

const SingleRequestLayout = () => {
  const { currentStep } = useAppSelector(
    (state) => state.request.currentRequest
  );

  const CurrentComponent = stepComponents[currentStep];
  return (
    <React.Fragment>    
      <CurrentComponent />
    </React.Fragment>
  );
};

export default SingleRequestLayout;
