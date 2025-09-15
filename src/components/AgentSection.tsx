import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AgentCard } from "./AgentCard";

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  rating: number;
  usageCount: number;
  isCustom: boolean;
}

interface AgentSectionProps {
  title: string;
  subtitle?: string;
  agents: Agent[];
  onAgentSelect: (agentId: string) => void;
  defaultExpanded?: boolean;
  emptyMessage?: string;
}

export const AgentSection = ({
  title,
  subtitle,
  agents,
  onAgentSelect,
  defaultExpanded = true,
  emptyMessage = "Агенты не найдены"
}: AgentSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (agents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground mb-2">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground">
            Попробуйте изменить критерии поиска или создать нового агента
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {title}
            <span className="text-sm text-muted-foreground font-normal">
              ({agents.length})
            </span>
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              Свернуть
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Развернуть
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3 animate-fade-in">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              {...agent}
              onSelect={onAgentSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};