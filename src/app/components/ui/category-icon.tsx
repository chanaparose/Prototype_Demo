import {
  Boxes,
  ClipboardList,
  FlaskConical,
  Package,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  '📦': Package,
  '✨': Sparkles,
  '🧪': FlaskConical,
  '🛡️': ShieldCheck,
  '📋': ClipboardList,
};

export function CategoryIcon({
  value,
  size = 18,
  className,
}: {
  value?: string | React.ReactNode;
  size?: number;
  className?: string;
}) {
  if (typeof value !== 'string') return value ?? <Boxes size={size} className={className} />;
  const Icon = ICONS[value] ?? Boxes;
  return <Icon size={size} className={className} />;
}
