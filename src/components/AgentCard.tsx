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
  Edit,
  X,
  Zap,
  Shield
} from "lucide-react";

interface AgentCardProps {
  id: string;
  name: string;
  type: string;
  description: string;
  prompt?: string;
  rating?: number;
  usageCount?: number;
  isCustom: boolean;
  isSelected?: boolean;
  aiProvider?: string;
  aiModel?: string;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
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
    case "analyst": return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
    case "creative": return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800";
    case "technical": return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800";
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

const getProviderIcon = (provider?: string) => {
  switch (provider) {
    case 'openai': return <Zap className="w-3 h-3" />;
    case 'anthropic': return <Shield className="w-3 h-3" />;
    case 'google': return <Brain className="w-3 h-3" />;
    default: return null;
  }
};

const getProviderName = (provider?: string) => {
  switch (provider) {
    case 'openai': return 'OpenAI';
    case 'anthropic': return 'Anthropic';
    case 'google': return 'Google';
    default: return 'AI';
  }
};

export const AgentCard = ({
  id,
  name,
  type,
  description,
  isCustom,
  aiProvider,
  aiModel,
  onSelect,
  onEdit,
  onDelete
}: AgentCardProps) => {
  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-muted-foreground/20"
      onClick={() => onSelect?.(id)}
    >
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getAgentColor(type)}`}>
              {getAgentIcon(type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <CardTitle className="text-base">{name}</CardTitle>
                <div className="flex items-center gap-1.5">
                  <Badge 
                    className={`text-xs border-0 ${getAgentColor(type)}`}
                  >
                    {getAgentTypeName(type)}
                  </Badge>
                  <Badge 
                    className={`text-xs flex items-center gap-1 border-0 ${
                      isCustom 
                        ? "bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/25" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/60"
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
              
              <CardDescription className="text-sm leading-snug line-clamp-2 mb-2">
                {description}
              </CardDescription>

              {/* AI Provider Info */}
              {aiProvider && aiModel && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getProviderIcon(aiProvider)}
                  <span>{getProviderName(aiProvider)}</span>
                  <span>•</span>
                  <span>{aiModel}</span>
                </div>
              )}
            </div>
          </div>
          
          {isCustom ? (
            // Для своих агентов - крестик удаления
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
              }}
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
            >
              <X className="w-4 h-4" />
            </Button>
          ) : (
            // Для агентов из маркетплейса - крестик удаления
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
              }}
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};