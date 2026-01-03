export default function GridBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[900px] rounded-full opacity-30 blur-3xl animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.350) 0%, rgba(59, 131, 246, 0.175) 50%, transparent 100%)'
        }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 w-full h-full opacity-50"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(59, 130, 246, 0.3) 50px, rgba(59, 130, 246, 0.3) 51px),
            repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(59, 130, 246, 0.3) 50px, rgba(59, 130, 246, 0.3) 51px)
          `,
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />
    </div>
  );
}
