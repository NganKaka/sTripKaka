import { useState, useEffect } from 'react';
import { cldUrl, cldSrcSet } from './cloudinary';

export type FadeInImageProps = {
  src: string;
  alt: string;
  className: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'sync' | 'async' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  width?: number;
  sizes?: string;
  srcSetWidths?: number[];
};

export default function FadeInImage({
  src,
  alt,
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  width,
  sizes,
  srcSetWidths,
}: FadeInImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  const optimizedSrc = cldUrl(src, width ? { width } : {});
  const srcSet = srcSetWidths ? cldSrcSet(src, srcSetWidths) : undefined;

  return (
    <span className={`block transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <img
        key={src}
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
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
