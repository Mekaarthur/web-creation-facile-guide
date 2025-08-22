import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, Lock, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserProfileMenuProps {
  userType?: 'client' | 'provider';
}

const UserProfileMenu = ({ userType = 'client' }: UserProfileMenuProps) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const profileLink = userType === 'provider' ? '/espace-prestataire' : '/espace-personnel?tab=profil';
  const dashboardLink = userType === 'provider' ? '/espace-prestataire' : '/espace-personnel';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-auto px-2 hover:bg-primary/10">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(user.email || '')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline-block">
            {user.email?.split('@')[0]}
          </span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            {userType === 'provider' ? 'Espace Prestataire' : 'Espace Client'}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={dashboardLink} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Mon tableau de bord
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={profileLink} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Mettre à jour mes infos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/reset-password" className="cursor-pointer">
            <Lock className="mr-2 h-4 w-4" />
            Changer mon mot de passe
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileMenu;