import React from 'react';
import { Card } from '@/components/ui/card';

export function ComponentDemo({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex items-center justify-center p-4 mt-2 bg-background">
      {children}
    </Card>
  );
}
