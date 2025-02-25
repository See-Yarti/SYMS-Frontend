export type TRequestFilters = {
  search: string | null;
  status: string[] | null;
  type: string[] | null;
  timestamp: string | null;
};

export type TRequest = {
  id: string;
  type: string;
  status: string;
  timestamp: string;
  subject: string;
  content: string;
  user: {
    name: string;
    email: string;
    image: string;
  };
};

export type TCurrentRequestStep = 'view' | 'reject';

export type TCurrentRequest = {
  requestId: string | number | null;
  currentStep: TCurrentRequestStep;
};

export type TRequestState = {
  filters: TRequestFilters;
  currentRequest: TCurrentRequest;
  requests: TRequest[];
};
