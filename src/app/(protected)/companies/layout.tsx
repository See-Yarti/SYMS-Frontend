import Companies from '@/components/pages/company/Companies';

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Companies>{children}</Companies>;
}
