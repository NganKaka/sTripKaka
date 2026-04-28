import { useState, useEffect } from 'react';

export type FadeInImageProps = {
  src: string;
  alt: string;
  className: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'sync' | 'async' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export default function FadeInImage({ src, alt, className, loading = 'lazy', decoding = 'async', fetchPriority }: FadeInImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <span className={`block transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <img
        key={src}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        className={className}
      />
    </span>
  );
}
