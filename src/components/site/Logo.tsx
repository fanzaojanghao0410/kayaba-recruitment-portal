import logoAsset from "@/assets/kayaba/kayaba-logo.png.asset.json";
const logoImage = logoAsset.url;

export function Logo({ 
  className = "", 
  size = "md" 
}: { 
  className?: string; 
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto",
    lg: "h-16 w-auto"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoImage} 
        alt="Logo Kayaba" 
        className={`${sizeClasses[size]} object-contain`} 
      />
    </div>
  );
}

