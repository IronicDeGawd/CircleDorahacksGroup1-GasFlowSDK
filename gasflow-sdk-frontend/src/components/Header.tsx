import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 w-full z-50 glass-effect border-b border-border/50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-primary p-2 rounded-xl shadow-soft">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-gradient">GasFlow SDK</span>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `font-medium transition-smooth ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink 
            to="/documentation" 
            className={({ isActive }) => 
              `font-medium transition-smooth ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            Documentation
          </NavLink>
          <NavLink 
            to="/samples" 
            className={({ isActive }) => 
              `font-medium transition-smooth ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            Sample Projects
          </NavLink>
        </nav>

        <Button variant="outline" size="sm" className="glass-effect">
          Get Started
        </Button>
      </div>
    </header>
  );
};

export default Header;