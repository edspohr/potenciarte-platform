export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <div className="flex justify-center items-center h-full min-h-[200px]">
      <div className="relative">
        <div className={`${dimensions[size]} rounded-full border-2 border-transparent border-t-orange-500 border-r-orange-500/30 animate-spin`} />
        <div className={`absolute inset-0 ${dimensions[size]} rounded-full border-2 border-transparent border-b-orange-400/20 animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
    </div>
  );
}
