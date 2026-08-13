import { Home, Heart, MapPin, User, GraduationCap, CalendarDays } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/aulas", label: "Aulas", icon: GraduationCap },
  { path: "/eventos", label: "Eventos", icon: CalendarDays },
  { path: "/doacoes", label: "Doações", icon: Heart },
  { path: "/mapa", label: "Mapa", icon: MapPin },
  { path: "/perfil", label: "Perfil", icon: User },
];


const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
              <span className="text-[0.65rem] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
