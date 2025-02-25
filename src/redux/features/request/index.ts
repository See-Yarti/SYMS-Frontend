import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TRequestFilters, TRequestState, TRequest, TCurrentRequestStep } from './types';

export const initialState: TRequestState = {
  filters: {
    search: null,
    status: [],
    type: [],
    timestamp: null,
  },
  currentRequest: {
    requestId: null,
    currentStep: 'view',
  },
  requests: [],
};

export const requestSlice = createSlice({
  name: 'request',
  initialState,
  reducers: {
    // Clears all filters by resetting to the initial state
    clearFilters: (state) => {
      state.filters = { ...initialState.filters };
    },

    // Clears a single filter by name
    clearFilter: (state, action: PayloadAction<keyof TRequestFilters>) => {
      const filterName = action.payload;
      if (filterName in state.filters) {
        state.filters[filterName] = null;
      }
    },

    // Sets a specific filter to a provided value
    setFilter: (
      state,
      action: PayloadAction<{
        filter: 'status' | 'type';
        value: string | null;
      }>
    ) => {
      const { filter, value } = action.payload;
      if (value === null) {
        // Reset the filter
        state.filters[filter] = [];
      } else {
        const currentFilter =
          filter == 'type' ? state.filters.type : state.filters.status;
        if (!currentFilter) {
          state.filters[filter] = [value];
        } else if (currentFilter && currentFilter.includes(value)) {
          // Remove the value from the array
          state.filters[filter] = currentFilter.filter((v) => v !== value);
        } else {
          // Append the value to the array
          state.filters[filter] = [...currentFilter, value];
        }
      }
    },

    // Sets the search query
    setSearchQuery: (state, action: PayloadAction<string | null>) => {
      state.filters.search = action.payload;
    },

    // set the timestamp
    setTimestamp: (state, action: PayloadAction<string | null>) => {
      state.filters.timestamp = action.payload || null;
    },

    // Sets the current request ID
    setCurrentRequestID: (state, action: PayloadAction<string | null>) => {
      state.currentRequest.requestId = action.payload;
    },

    // Sets the current step for the request
    setCurrentRequestStep: (state, action: PayloadAction<TCurrentRequestStep>) => {
      state.currentRequest.currentStep = action.payload;
    },

    // Adds a new request to the requests array
    addRequest: (state, action: PayloadAction<TRequest>) => {
      state.requests.push(action.payload);
    },

    // Removes a request by ID from the requests array
    removeRequest: (state, action: PayloadAction<string>) => {
      const requestIdToRemove = action.payload;
      const requestIndex = state.requests.findIndex(
        (request) => request.id === requestIdToRemove
      );

      // If the request exists, remove it
      if (requestIndex !== -1) {
        const removedRequest = state.requests[requestIndex];
        state.requests = state.requests.filter(
          (request) => request.id !== requestIdToRemove
        );

        // If the removed request's ID was the currentRequestID, update currentRequestID
        if (state.currentRequest.requestId === removedRequest.id) {
          // Set currentRequestID to the previous request's ID, if available
          const previousRequest = state.requests[requestIndex - 1];
          state.currentRequest.requestId = previousRequest ? previousRequest.id : null;
        }
      }
    },
  },
});

export const requestActions = requestSlice.actions;
export const requestReducer = requestSlice.reducer;
export default requestSlice.reducer;
