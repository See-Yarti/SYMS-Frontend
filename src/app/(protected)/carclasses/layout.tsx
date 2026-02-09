import CarClass from '@/components/pages/carclass/CarClass';

export default function CarClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CarClass>{children}</CarClass>;
}
