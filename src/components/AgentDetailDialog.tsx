import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Lightbulb, 
  Code, 
  Gavel, 
  Search,
  Star,
  Play,
  Settings,
  Copy,
  User,
  Tag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  rating?: number;
  usageCount?: number;
  prompt?: string;
  category?: string;
  author?: string;
  tags?: string[];
}

interface AgentDetailDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getAgentIcon = (type: string) => {
  switch (type) {
    case "analyst": return <Brain className="w-6 h-6" />;
    case "creative": return <Lightbulb className="w-6 h-6" />;
    case "technical": return <Code className="w-6 h-6" />;
    case "judge": return <Gavel className="w-6 h-6" />;
    case "researcher": return <Search className="w-6 h-6" />;
    default: return <Brain className="w-6 h-6" />;
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

export const AgentDetailDialog = ({ agent, open, onOpenChange }: AgentDetailDialogProps) => {
  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getAgentColor(agent.type)}`}>
              {getAgentIcon(agent.type)}
            </div>
            <div>
              <DialogTitle className="text-2xl">{agent.name}</DialogTitle>
              <Badge variant="outline" className="mt-1">
                {getAgentTypeName(agent.type)}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base">
            {agent.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agent Information Form Style */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent-name">Название агента</Label>
              <Input
                id="agent-name"
                value={agent.name}
                readOnly
                className="mt-1 bg-muted/30"
              />
            </div>
            
            <div>
              <Label htmlFor="agent-type">Тип агента</Label>
              <Input
                id="agent-type"
                value={getAgentTypeName(agent.type)}
                readOnly
                className="mt-1 bg-muted/30"
              />
            </div>
            
            <div>
              <Label htmlFor="agent-description">Описание</Label>
              <Textarea
                id="agent-description"
                value={agent.description}
                readOnly
                className="mt-1 min-h-20 bg-muted/30"
              />
            </div>
            
            {agent.prompt && (
              <div>
                <Label htmlFor="agent-prompt">Системный промпт</Label>
                <Textarea
                  id="agent-prompt"
                  value={agent.prompt}
                  readOnly
                  className="mt-1 min-h-32 font-mono text-sm bg-muted/30"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Промпт определяет как агент будет вести себя и отвечать на запросы
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {(agent.author || agent.tags) && (
            <>
              <Separator />
              <div className="space-y-3">
                {agent.author && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Автор:</span>
                    <span>{agent.author}</span>
                  </div>
                )}
                
                {agent.tags && agent.tags.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">Теги:</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Stats (только если есть) */}
          {(agent.rating || agent.usageCount) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {agent.rating && (
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">{agent.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Рейтинг</p>
                  </div>
                )}
                {agent.usageCount && (
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold mb-1">{agent.usageCount}</div>
                    <p className="text-sm text-muted-foreground">Использований</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};