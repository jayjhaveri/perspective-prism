import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, LogIn, Menu, Plus, User, LogOut } from "lucide-react";

const PerspectiveHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Helper for New button: reload if already on /, else navigate
  const handleNew = () => {
    if (location.pathname === "/") {
      window.location.reload();
    } else {
      navigate("/");
    }
  };

  return (
    <header className="border-b py-3 px-4 bg-card">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-primary">Perspective</span> Prism
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/history")}
                className="hidden sm:flex"
              >
                <History className="mr-2 h-4 w-4" />
                History
              </Button>

              <Button
                variant="ghost"
                onClick={handleNew}
                className="hidden sm:flex"
              >
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            </>
          )}

          {!user ? (
            <Button variant="outline" onClick={() => navigate('/auth')}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/history")}>
                  <History className="mr-2 h-4 w-4" />
                  History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Session
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="block sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem onClick={() => navigate("/history")}>
                    <History className="mr-2 h-4 w-4" />
                    History
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PerspectiveHeader;
