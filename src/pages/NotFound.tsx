import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-xl text-muted-foreground">Page not found</p>
        </div>
        <p className="text-muted-foreground max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <a href="/" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </a>
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;
