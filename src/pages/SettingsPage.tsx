import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  BellOff, 
  PartyPopper, 
  Download, 
  Trash2, 
  RotateCcw,
  ChevronRight,
  Info
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useHabits } from '@/contexts/HabitContext';
import { useTheme } from '@/hooks/useTheme';
import { getEffectiveDate, getDayName, formatDateForDisplay } from '@/lib/dateUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { 
    settings, 
    updateSettings, 
    habits, 
    completions,
    exportData, 
    resetAllData,
    backups,
    restoreBackup
  } = useHabits();
  const { theme, setTheme } = useTheme();
  const [showDataInfo, setShowDataInfo] = useState(false);

  const today = getEffectiveDate();
  const totalHabits = habits.length;
  const activeHabits = habits.filter(h => h.active).length;
  const totalCompletions = completions.length;

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-flow-export-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!', { description: 'Your data has been downloaded.' });
  };

  const handleReset = () => {
    resetAllData();
    toast.success('Data reset!', { description: 'All your data has been cleared.' });
  };

  const handleRestoreBackup = (index: number) => {
    if (restoreBackup(index)) {
      toast.success('Backup restored!', { description: 'Your data has been restored from backup.' });
    } else {
      toast.error('Restore failed', { description: 'Could not restore from backup.' });
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          updateSettings({ notificationsEnabled: true });
          toast.success('Notifications enabled!');
        } else {
          toast.error('Permission denied', { description: 'Please allow notifications in your browser settings.' });
        }
      } else {
        toast.error('Not supported', { description: 'Notifications are not supported in this browser.' });
      }
    } else {
      updateSettings({ notificationsEnabled: false });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your experience</p>
        </motion.header>

        {/* Theme */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-card border border-border space-y-4"
        >
          <h3 className="font-medium text-foreground">Appearance</h3>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'light', icon: Sun, label: 'Light' },
              { value: 'dark', icon: Moon, label: 'Dark' },
              { value: 'system', icon: Monitor, label: 'System' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                  theme === value 
                    ? "bg-primary/10 border-primary" 
                    : "bg-background border-border hover:border-primary/30"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-card border border-border space-y-4"
        >
          <h3 className="font-medium text-foreground">Preferences</h3>
          
          {/* Date Format */}
          <div className="flex items-center justify-between">
            <Label htmlFor="date-format">Date format</Label>
            <Select 
              value={settings.dateFormat} 
              onValueChange={(v) => updateSettings({ dateFormat: v as any })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Percentage Precision */}
          <div className="flex items-center justify-between">
            <Label htmlFor="precision">Percentage precision</Label>
            <Select 
              value={String(settings.percentagePrecision)} 
              onValueChange={(v) => updateSettings({ percentagePrecision: Number(v) as 0 | 1 | 2 })}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 (33%)</SelectItem>
                <SelectItem value="1">1 (33.3%)</SelectItem>
                <SelectItem value="2">2 (33.33%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-card border border-border space-y-4"
        >
          <h3 className="font-medium text-foreground">Notifications</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.notificationsEnabled ? (
                <Bell className="w-5 h-5 text-success" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
              <Label htmlFor="notifications">Habit reminders</Label>
            </div>
            <Switch
              id="notifications"
              checked={settings.notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PartyPopper className="w-5 h-5 text-warning" />
              <Label htmlFor="celebrations">Milestone celebrations</Label>
            </div>
            <Switch
              id="celebrations"
              checked={settings.milestoneCelebrations}
              onCheckedChange={(v) => updateSettings({ milestoneCelebrations: v })}
            />
          </div>
        </motion.section>

        {/* Data Management */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl bg-card border border-border space-y-4"
        >
          <h3 className="font-medium text-foreground">Data</h3>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export data</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Backups */}
          {backups.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Recent backups</Label>
              {backups.slice(0, 3).map((backup, index) => (
                <AlertDialog key={backup.date}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        <span>{formatDateForDisplay(backup.date, settings.dateFormat)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Restore</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restore backup?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will replace your current data with the backup from {formatDateForDisplay(backup.date, settings.dateFormat)}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRestoreBackup(index)}>
                        Restore
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ))}
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Reset all data</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your habits, completions, reviews, and settings. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.section>

        {/* Data Info (Hidden by default) */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button 
            onClick={() => setShowDataInfo(!showDataInfo)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>Data info</span>
          </button>

          {showDataInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-3 rounded-lg bg-muted/50 text-sm space-y-1"
            >
              <p>Total habits: {totalHabits}</p>
              <p>Active habits: {activeHabits}</p>
              <p>Total completions: {totalCompletions}</p>
              <p>Current day (4AM reset): {getDayName(today)}, {today}</p>
              <p>Backups stored: {backups.length}</p>
            </motion.div>
          )}
        </motion.section>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-6 space-y-1"
        >
          <p className="text-sm font-medium text-foreground">Habit Flow</p>
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
        </motion.div>
      </div>
    </Layout>
  );
}
