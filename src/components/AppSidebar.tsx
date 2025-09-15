import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Brain, Bot, Settings, Home, Sparkles, Key, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Главная", url: "/", icon: Home },
  { title: "Мои агенты", url: "/my-agents", icon: Brain },
  { title: "Маркетплейс", url: "/marketplace", icon: Bot },
  { title: "Playground", url: "/playground", icon: MessageSquare },
  { title: "API ключи", url: "/api-keys", icon: Key },
  { title: "Настройки", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle hover expand/collapse
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsCollapsed(true);
    }, 500); // Больше времени для комфорта
    setHoverTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  return (
    <aside 
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-500 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      } bg-card/95 backdrop-blur-lg border-r border-border/50 shadow-2xl`} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="px-4 py-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center shrink-0 shadow-lg">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in opacity-0 animate-delay-150" style={{ animation: 'fade-in 0.3s ease-out 0.2s forwards' }}>
              <h2 className="font-bold text-lg">AI Platform</h2>
              <p className="text-xs text-muted-foreground">Агенты & Боты</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-2 py-4 flex-1 overflow-hidden">
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider opacity-0 animate-fade-in" style={{ animation: 'fade-in 0.3s ease-out 0.3s forwards' }}>
              Навигация
            </div>
          )}
          
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = currentPath === item.url;
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  className={`
                    relative group transition-all duration-300 ease-out flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:shadow-md
                    ${isActive 
                      ? "bg-primary/15 text-primary shadow-lg scale-105" 
                      : "hover:bg-muted/70 hover:text-foreground hover:scale-102"
                    }
                    ${isCollapsed ? "justify-center" : "justify-start"}
                  `}
                  style={{ 
                    animationDelay: `${index * 0.05}s`,
                    transform: isCollapsed ? 'scale(1)' : 'scale(1)'
                  }}
                >
                  <item.icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-primary' : ''}`} />
                  {!isCollapsed && (
                    <span className="font-medium transition-all duration-300 opacity-0 animate-fade-in" style={{ animation: 'fade-in 0.3s ease-out 0.4s forwards' }}>{item.title}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="absolute right-2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="mt-8">
            <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Быстрые действия
            </div>
            <div className="px-3 py-2 bg-gradient-ai/10 rounded-lg border border-primary/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">6 Агентов</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">3 Бота</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}