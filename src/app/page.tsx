import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default function RootPage() {
  // Redirect to dashboard
  redirect('/dashboard');
}
