import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Lightbulb, 
  Code, 
  Gavel, 
  Search,
  Star,
  Plus
} from "lucide-react";

interface AgentCardProps {
  id: string;
  name: string;
  type: string;
  description: string;
  prompt?: string;
  rating: number;
  usageCount: number;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
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
    case "analyst": return "bg-agent-analyst text-primary-foreground";
    case "creative": return "bg-agent-creative text-primary-foreground";
    case "technical": return "bg-agent-technical text-primary-foreground";
    case "judge": return "bg-agent-judge text-primary-foreground";
    case "researcher": return "bg-agent-researcher text-primary-foreground";
    default: return "bg-primary text-primary-foreground";
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
  isSelected = false,
  onSelect
}: AgentCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? "ring-2 ring-primary shadow-ai" 
          : "hover:bg-card/80"
      }`}
      onClick={() => onSelect?.(id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getAgentColor(type)}`}>
              {getAgentIcon(type)}
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {getAgentTypeName(type)}
              </Badge>
            </div>
          </div>
          
          {isSelected && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground rotate-45" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-sm mb-4">
          {description}
        </CardDescription>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{rating}</span>
          </div>
          <span>{usageCount} использований</span>
        </div>
      </CardContent>
    </Card>
  );
};