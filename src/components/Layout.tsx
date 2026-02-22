import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={cn("pb-24 pt-4 px-4 max-w-lg mx-auto", className)}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
