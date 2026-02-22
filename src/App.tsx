import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HabitProvider } from "@/contexts/HabitContext";
import { useTheme } from "@/hooks/useTheme";
import { useHabitReminders } from "@/hooks/useHabitReminders";
import TodayPage from "./pages/TodayPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReviewPage from "./pages/ReviewPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useTheme();
  useHabitReminders();

  useEffect(() => {
    const testRead = async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .limit(5);

      console.log("READ RESULT:", data, error);
    };

    testRead();
  }, []);
  return (
    <Routes>
      <Route path="/" element={<TodayPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HabitProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </HabitProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
