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
    }, 300); // Small delay before collapsing
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
      className={`${isCollapsed ? "w-16" : "w-64"} transition-all duration-300 bg-card/50 backdrop-blur border-r border-border/50 flex flex-col`} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="px-4 py-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h2 className="font-bold text-lg">AI Platform</h2>
              <p className="text-xs text-muted-foreground">Агенты & Боты</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-2 py-4 flex-1">
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                    relative group hover-scale transition-all duration-200 flex items-center gap-3 w-full px-3 py-2 rounded-lg
                    ${isActive 
                      ? "bg-primary/15 text-primary border-r-2 border-primary shadow-lg" 
                      : "hover:bg-muted/70 hover:text-foreground"
                    }
                    ${isCollapsed ? "justify-center" : "justify-start"}
                  `}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  {!isCollapsed && (
                    <span className="font-medium animate-fade-in">{item.title}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="absolute right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
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