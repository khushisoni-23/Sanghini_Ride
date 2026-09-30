export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const VARIANTS = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-purple-50 text-purple-800 border-purple-200',
    purple: 'bg-purple-100/80 text-purple-900 border-purple-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
  };

  const SIZES = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${
        VARIANTS[variant] || VARIANTS.default
      } ${SIZES[size] || SIZES.md} ${className}`}
    >
      {children}
    </span>
  );
}
