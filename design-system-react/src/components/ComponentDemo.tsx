import React from 'react';

export function ComponentDemo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
      {children}
    </div>
  );
}
