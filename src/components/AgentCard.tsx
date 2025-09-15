import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Lightbulb, 
  Code, 
  Gavel, 
  Search,
  User,
  Store,
  Edit
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
  onEdit?: (id: string) => void;
}

const getAgentIcon = (type: string) => {
  switch (type) {
    case "analyst": return <Brain className="w-5 h-5" />;
    case "creative": return <Lightbulb className="w-5 h-5" />;
    case "technical": return <Code className="w-5 h-5" />;
    case "judge": return <Gavel className="w-5 h-5" />;
    case "researcher": return <Search className="w-5 h-5" />;
    default: return <Brain className="w-5 h-5" />;
  }
};

const getAgentColor = (type: string) => {
  switch (type) {
    case "analyst": return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
    case "creative": return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800";
    case "technical": return "bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800";
    case "judge": return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800";
    case "researcher": return "bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800";
    default: return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800";
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
  isCustom,
  onSelect,
  onEdit
}: AgentCardProps) => {
  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-muted-foreground/20"
      onClick={() => onSelect?.(id)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getAgentColor(type)}`}>
              {getAgentIcon(type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <CardTitle className="text-lg">{name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`text-xs border-0 ${getAgentColor(type)}`}
                  >
                    {getAgentTypeName(type)}
                  </Badge>
                  <Badge 
                    className={`text-xs flex items-center gap-1 border-0 ${
                      isCustom 
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40" 
                        : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40"
                    }`}
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
              </div>
              
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            </div>
          </div>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(id);
            }}
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <Edit className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};