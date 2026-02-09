import Rate from '@/components/pages/rate/RatesLayout';

export default function RateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Rate>{children}</Rate>;
}
