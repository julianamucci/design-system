import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
}

export function ImageWithFallback({ fallbackText = 'Image not available', src, alt, ...props }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="flex flex-col items-center justify-center bg-muted/20 text-muted-foreground w-full h-full min-h-[200px] border rounded-md">
        <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
        <span className="text-sm">{fallbackText}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setError(true)} 
      {...props} 
    />
  );
}
