import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart3, Sunset, BookOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isWeekend, getEffectiveDate, isSunday } from '@/lib/dateUtils';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const today = getEffectiveDate();
  const isWeekendDay = isWeekend(today);
  const isSundayDay = isSunday(today);

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: isWeekendDay ? 'Weekend' : 'Today',
      showDot: false
    },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', showDot: false },
    { path: '/review', icon: BookOpen, label: 'Review', showDot: isSundayDay },
    { path: '/settings', icon: Settings, label: 'Settings', showDot: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200",
                "min-w-[60px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
                {item.showDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full" />
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
