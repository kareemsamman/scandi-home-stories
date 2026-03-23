import { useState } from "react";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Drop-in <img> replacement that:
 * - Shows a gray skeleton while loading
 * - Fades in smoothly when loaded
 * - Adds loading="lazy" automatically
 */
export const LazyImage = ({ src, alt, className = "", ...props }: Props) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={`relative block overflow-hidden ${className}`} aria-hidden={!alt}>
      {/* Skeleton shown until image loads */}
      {!loaded && (
        <span className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        {...props}
      />
    </span>
  );
};
