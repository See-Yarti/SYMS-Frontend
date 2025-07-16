import React, { useState } from 'react';

interface Location {
  id: string;
  name: string;
  icon: string;
}

interface RateGroup {
  group: string;
  carClass: string;
  begin: string;
  end: string;
  blackouts: string;
  netAvail: number;
  taxesFees: number;
  coverage: number;
  policy: number;
  equipment: number;
  lastModified: string;
}

const Rate: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locations] = useState<Location[]>([
    { id: '1', name: 'Dubai', icon: 'airplane' },
    { id: '2', name: 'Marietta', icon: 'home' },
    { id: '3', name: 'Sharjah Airport', icon: 'airplane' },
  ]);

  const [rateGroups] = useState<RateGroup[]>([
    { group: 'STAN', carClass: 'MCAR', begin: '06/05/2025', end: '07/17/2025', blackouts: '$!', netAvail: 108.00, taxesFees: 0.00, coverage: 150.00, policy: 10.00, equipment: 0.00, lastModified: 'Thursday 10:49 PM by marietta@pricelesscarrental.com' },
    { group: 'STAN', carClass: 'MCAR', begin: '07/18/2025', end: '07/20/2025', blackouts: '$!', netAvail: 108.00, taxesFees: 0.00, coverage: 150.00, policy: 10.00, equipment: 0.00, lastModified: 'Thursday 10:49 PM by marietta@pricelesscarrental.com' },
    { group: 'STAN', carClass: 'MCAR', begin: '07/21/2025', end: '08/09/2025', blackouts: '$!', netAvail: 108.00, taxesFees: 0.00, coverage: 150.00, policy: 10.00, equipment: 0.00, lastModified: 'Thursday 10:49 PM by marietta@pricelesscarrental.com' },
  ]);

  return (
    <div className="p-4">
      {/* Location Selection */}
      {!selectedLocation && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Select Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className="bg-gray-700 text-white p-4 rounded-lg hover:bg-gray-600 flex items-center"
              >
                <span className={`mr-2 text-xl ${location.icon === 'airplane' ? 'text-blue-400' : 'text-green-400'}`}>✈️</span>
                {location.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rate Table */}
      {selectedLocation && (
        <div>
          <h2 className="text-lg font-bold mb-2">Rate Management - {locations.find(l => l.id === selectedLocation)?.name}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 text-white">
              <thead>
                <tr>
                  <th className="px-4 py-2">Group</th>
                  <th className="px-4 py-2">Car Class</th>
                  <th className="px-4 py-2">Begin</th>
                  <th className="px-4 py-2">End</th>
                  <th className="px-4 py-2">Blackouts</th>
                  <th className="px-4 py-2">Net Avail</th>
                  <th className="px-4 py-2">Taxes/Fees</th>
                  <th className="px-4 py-2">Coverage</th>
                  <th className="px-4 py-2">Policy</th>
                  <th className="px-4 py-2">Equipment</th>
                  <th className="px-4 py-2">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {rateGroups.map((group, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="px-4 py-2">{group.group}</td>
                    <td className="px-4 py-2">{group.carClass}</td>
                    <td className="px-4 py-2">{group.begin}</td>
                    <td className="px-4 py-2">{group.end}</td>
                    <td className="px-4 py-2">{group.blackouts}</td>
                    <td className="px-4 py-2">${group.netAvail.toFixed(2)}</td>
                    <td className="px-4 py-2">${group.taxesFees.toFixed(2)}</td>
                    <td className="px-4 py-2">${group.coverage.toFixed(2)}</td>
                    <td className="px-4 py-2">${group.policy.toFixed(2)}</td>
                    <td className="px-4 py-2">${group.equipment.toFixed(2)}</td>
                    <td className="px-4 py-2">{group.lastModified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setSelectedLocation(null)}
            className="mt-4 bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600"
          >
            Back to Locations
          </button>
        </div>
      )}
    </div>
  );
};

export default Rate;