import { forwardRef } from 'react';

const VARIANTS = {
  primary:
    'bg-purple-700 text-white hover:bg-purple-800 active:bg-purple-900 shadow-sm hover:shadow-md focus-visible:ring-purple-600',
  secondary:
    'bg-purple-50 text-purple-900 hover:bg-purple-100 active:bg-purple-200 border border-purple-200/80 focus-visible:ring-purple-500',
  outline:
    'bg-white text-slate-800 hover:text-slate-950 hover:bg-slate-50 border border-slate-300 shadow-2xs focus-visible:ring-slate-400',
  white:
    'bg-white text-purple-950 hover:bg-purple-50 active:bg-purple-100 shadow-md hover:shadow-lg font-bold border border-white focus-visible:ring-white',
  'outline-white':
    'bg-transparent text-white hover:bg-white/15 active:bg-white/20 border-2 border-white/80 font-bold focus-visible:ring-white',
  ghost:
    'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500',
};

const SIZES = {
  sm: 'px-3.5 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base font-semibold rounded-xl gap-2.5',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    className = '',
    ...props
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-sans tracking-tight transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

export default Button;
