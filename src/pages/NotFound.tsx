
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/95 p-4">
      <div className="glass-card p-10 rounded-xl max-w-md w-full text-center animate-scale-in">
        <h1 className="text-6xl font-bold mb-6">404</h1>
        <div className="w-16 h-1 bg-primary/30 mx-auto mb-6 rounded-full"></div>
        <p className="text-xl text-foreground mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className={cn(
            "inline-flex items-center justify-center",
            "px-6 py-3 rounded-md text-base font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors",
            "shadow-sm"
          )}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
