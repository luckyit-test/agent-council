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
    }, 200); // Быстрее сворачивается
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
      className={`transition-all duration-300 ease-out ${
        isCollapsed ? "w-16" : "w-64"
      } bg-card/95 backdrop-blur-sm border-r border-border/30 flex flex-col h-full shadow-sm`} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="px-3 py-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h2 className="font-semibold text-sm">AI Platform</h2>
              <p className="text-xs text-muted-foreground">Агенты & Боты</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-2 py-3 flex-1 overflow-hidden">
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
                    relative group transition-all duration-200 flex items-center gap-3 w-full px-3 py-2 rounded-lg
                    ${isActive 
                      ? "bg-primary/15 text-primary shadow-sm" 
                      : "hover:bg-muted/50 hover:text-foreground"
                    }
                    ${isCollapsed ? "justify-center" : "justify-start"}
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  {!isCollapsed && (
                    <span className="font-medium text-sm animate-fade-in">{item.title}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="absolute right-2 w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions - только когда развернуто */}
        {!isCollapsed && (
          <div className="mt-6 px-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Статистика
            </div>
            <div className="p-3 bg-gradient-ai/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium">6 Агентов</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-3 h-3 text-accent" />
                <span className="text-xs font-medium">3 Бота</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}