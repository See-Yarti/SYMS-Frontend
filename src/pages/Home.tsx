// src/pages/Home.tsx
import { useAppSelector } from '@/store';

const Home = () => {
  // Get user data from Redux store (already loaded during login)
  const { user } = useAppSelector((state) => state.auth);
  
  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>

        {/* Role-specific content */}
        {user.role === 'admin' && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Admin Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DashboardCard 
                title="Manage Operators"
                description="View and manage all operators"
                link="/operators"
              />
              <DashboardCard 
                title="System Settings"
                description="Configure system parameters"
                link="/settings"
              />
              <DashboardCard 
                title="View Reports"
                description="Access system reports"
                link="/reports"
              />
            </div>
          </div>
        )}

        {user.role === 'operator' && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Operator Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardCard 
                title="Manage Cars"
                description="View and manage car listings"
                link="/products"
              />
              <DashboardCard 
                title="View Orders"
                description="Track current orders"
                link="/orders"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable dashboard card component
const DashboardCard = ({ title, description, link }: { title: string; description: string; link: string }) => {
  return (
    <a 
      href={link}
      className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      <h4 className="font-medium text-lg mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </a>
  );
};

export default Home;