export function Stars({ value, size = 14, label }: { value: number; size?: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs><linearGradient id={`s${i}-${fill}`}><stop offset={`${fill * 100}%`} stopColor="#000" /><stop offset={`${fill * 100}%`} stopColor="#d9d9d9" /></linearGradient></defs>
            <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.5l1.3-6.6L2.5 9.3l6.6-.8L12 2.5z" fill={`url(#s${i}-${fill})`} />
          </svg>
        );
      })}
    </span>
  );
}
