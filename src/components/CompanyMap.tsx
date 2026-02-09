'use client';

import React, { useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface CompanyMapProps {
  locations: Location[];
  selectedCity?: string;
  selectedState?: string;
  selectedCountry?: string;
}

const CompanyMap: React.FC<CompanyMapProps> = ({
  locations,
  selectedCity,
  selectedState,
  selectedCountry,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);

  // Function to extract city/state/country from address
  const getAddressParts = (address: string) => {
    const parts = address.split(',').map((part) => part.trim());
    const city = parts.length > 1 ? parts[parts.length - 2] : '';
    const state = parts.length > 2 ? parts[parts.length - 3] : '';
    const country = parts.length > 0 ? parts[parts.length - 1] : '';
    return { city, state, country };
  };

  // Filter locations based on selected city/state/country
  const filterLocations = () => {
    if (!selectedCity && !selectedState && !selectedCountry) {
      return locations;
    }

    return locations.filter((loc) => {
      const { city, state, country } = getAddressParts(loc.address);

      if (
        selectedCity &&
        !city.toLowerCase().includes(selectedCity.toLowerCase())
      ) {
        return false;
      }
      if (
        selectedState &&
        !state.toLowerCase().includes(selectedState.toLowerCase())
      ) {
        return false;
      }
      if (
        selectedCountry &&
        !country.toLowerCase().includes(selectedCountry.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  };

  // Initialize or update the map
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const filteredLocations = filterLocations();

    if (filteredLocations.length === 0) {
      // Show a message when no locations match the filter
      mapRef.current.innerHTML =
        '<div class="flex items-center justify-center h-full text-gray-500">No locations found for the selected area</div>';
      return;
    }

    // Clear previous markers
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];

    // Initialize map if not already done
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: {
          lat: filteredLocations[0].lat,
          lng: filteredLocations[0].lng,
        },
        zoom: 12,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
    } else {
      // Recenter the map if it already exists
      mapInstance.current.setCenter({
        lat: filteredLocations[0].lat,
        lng: filteredLocations[0].lng,
      });
    }

    // Add markers for each location
    filteredLocations.forEach((loc) => {
      const marker = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: mapInstance.current,
        title: loc.address,
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div class="p-2">
          <h3 class="font-bold">Location</h3>
          <p class="text-sm">${loc.address}</p>
        </div>`,
      });

      marker.addListener('click', () => {
        infoWindow.open({
          anchor: marker,
          map: mapInstance.current,
          shouldFocus: false,
        });
      });

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (filteredLocations.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredLocations.forEach((loc) => {
        bounds.extend(new window.google.maps.LatLng(loc.lat, loc.lng));
      });
      mapInstance.current.fitBounds(bounds);
    }
  }, [locations, selectedCity, selectedState, selectedCountry]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-lg border border-gray-200 overflow-hidden"
    />
  );
};

export default CompanyMap;
