import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Lightbulb, 
  Code, 
  Gavel, 
  Search,
  Plus,
  User,
  Store,
  Play,
  Settings,
  Heart,
  MoreHorizontal
} from "lucide-react";

interface AgentCardProps {
  id: string;
  name: string;
  type: string;
  description: string;
  prompt?: string;
  rating: number;
  usageCount: number;
  isCustom: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const getAgentIcon = (type: string) => {
  switch (type) {
    case "analyst": return <Brain className="w-4 h-4" />;
    case "creative": return <Lightbulb className="w-4 h-4" />;
    case "technical": return <Code className="w-4 h-4" />;
    case "judge": return <Gavel className="w-4 h-4" />;
    case "researcher": return <Search className="w-4 h-4" />;
    default: return <Brain className="w-4 h-4" />;
  }
};

const getAgentColor = (type: string) => {
  switch (type) {
    case "analyst": return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    case "creative": return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
    case "technical": return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    case "judge": return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
    case "researcher": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

const getAgentTypeName = (type: string) => {
  switch (type) {
    case "analyst": return "Аналитик";
    case "creative": return "Творческий";
    case "technical": return "Технический";
    case "judge": return "Судья";
    case "researcher": return "Исследователь";
    default: return "Агент";
  }
};

export const AgentCard = ({
  id,
  name,
  type,
  description,
  rating,
  usageCount,
  isCustom,
  isSelected = false,
  onSelect
}: AgentCardProps) => {
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 ${
        isSelected 
          ? "ring-2 ring-primary shadow-lg shadow-primary/20" 
          : "hover:bg-card/80"
      }`}
      onClick={() => onSelect?.(id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getAgentColor(type)} transition-transform group-hover:scale-110`}>
              {getAgentIcon(type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base truncate">{name}</CardTitle>
                <Badge 
                  variant={isCustom ? "default" : "secondary"} 
                  className="text-xs flex items-center gap-1 shrink-0"
                >
                  {isCustom ? (
                    <>
                      <User className="w-3 h-3" />
                      Мой
                    </>
                  ) : (
                    <>
                      <Store className="w-3 h-3" />
                      Маркетплейс
                    </>
                  )}
                </Badge>
              </div>
              
              <Badge variant="outline" className="text-xs mb-2">
                {getAgentTypeName(type)}
              </Badge>
              
              <CardDescription className="text-sm line-clamp-2 group-hover:text-foreground/80 transition-colors">
                {description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isSelected && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                <Plus className="w-4 h-4 text-primary-foreground rotate-45" />
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                // Handle more options
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {usageCount} использований
            </span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Play className="w-3 h-3 mr-1" />
              Запустить
            </Button>
            
            {isCustom && (
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Settings className="w-3 h-3 mr-1" />
                Настроить
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Heart className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};