// src\pages\Home.tsx
import { useFetchData } from '@/hooks/useApi';

// So in that case we have to create a different Home page for different levels of users.
const Home = () => {
  const profile = useFetchData('/admin/profile', 'profile');
  if (profile.isLoading) return <>Loading..</>;
  return <>{profile.data.data.admin.id}</>;
  // return <>Home</>;
};

export default Home;
