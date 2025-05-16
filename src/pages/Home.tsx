// src/pages/Home.tsx
import { useAppSelector } from '@/store';

const Home = () => {
  const { user, otherInfo } = useAppSelector((state) => state.auth);

  if (!user) {
    return <div>Loading user data...</div>;
  }

  // Determine which role to display
  const displayRole = user.role === 'operator' && otherInfo?.operatorRole 
    ? otherInfo.operatorRole 
    : user.role;

  // Format the role for display
  const formattedRole = displayRole
    .split(/(?=[A-Z])/) // Split camelCase
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="border rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="">Email : {user.email}</p>
            <p className="">ID : {user.id}</p>

            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {formattedRole}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;