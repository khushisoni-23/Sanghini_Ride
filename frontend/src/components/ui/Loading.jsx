import logoImg from '../../assets/logo.png';

export default function Loading({
  message = 'Loading...',
  showLogo = false,
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="status"
    >
      {showLogo ? (
        <div className="relative mb-4">
          <img
            src={logoImg}
            alt="Sanghini Ride"
            className="w-14 h-14 object-contain animate-pulse"
          />
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping pointer-events-none" />
        </div>
      ) : (
        <div
          className={`${
            sizes[size] || sizes.md
          } border-purple-100 border-t-purple-700 rounded-full animate-spin mb-3`}
        />
      )}
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  );
}
