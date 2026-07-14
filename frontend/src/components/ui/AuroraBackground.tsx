export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute rounded-full blur-[90px] opacity-50"
        style={{
          width: 560, height: 560, top: -180, left: -120,
          background: 'radial-gradient(circle, var(--play-violet), transparent 65%)',
        }}
      />
      <div
        className="absolute rounded-full blur-[90px] opacity-40"
        style={{
          width: 620, height: 620, top: 120, right: -200,
          background: 'radial-gradient(circle, var(--play-cyan), transparent 65%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)',
        }}
      />
    </div>
  );
}
