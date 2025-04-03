// src\pages\Home.tsx
// This is a Home page where all the types of user interact on first time.
// We have a two types of levels of users who can login on this Software both have a different type of access level.

import { useFetchData } from '@/hooks/useApi';

// So in that case we have to create a different Home page for different levels of users.
const Home = () => {
  const profile = useFetchData('/admin/profile', 'profile');
  if (profile.isLoading) return <>Loading..</>;
  return <>{profile.data.data.admin.id}</>;
  // return <>Home</>;
};

export default Home;
