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
  Copy
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  rating: number;
  usageCount: number;
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
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{agent.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">Рейтинг</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold mb-1">{agent.usageCount}</div>
              <p className="text-sm text-muted-foreground">Использований</p>
            </div>
          </div>

          <Separator />

          {/* Capabilities */}
          <div>
            <h3 className="font-semibold mb-3">Возможности агента</h3>
            <div className="space-y-2 text-sm">
              {agent.type === "analyst" && (
                <>
                  <p>• Глубокий анализ данных и метрик</p>
                  <p>• Выявление трендов и закономерностей</p>
                  <p>• Создание аналитических отчетов</p>
                  <p>• Прогнозирование на основе данных</p>
                </>
              )}
              {agent.type === "creative" && (
                <>
                  <p>• Генерация креативных идей</p>
                  <p>• Создание контента и текстов</p>
                  <p>• Разработка творческих концепций</p>
                  <p>• Поиск нестандартных решений</p>
                </>
              )}
              {agent.type === "technical" && (
                <>
                  <p>• Решение технических задач</p>
                  <p>• Анализ кода и архитектуры</p>
                  <p>• Техническая документация</p>
                  <p>• Отладка и оптимизация</p>
                </>
              )}
              {agent.type === "judge" && (
                <>
                  <p>• Оценка качества работы</p>
                  <p>• Сравнение альтернативных решений</p>
                  <p>• Формирование итоговых выводов</p>
                  <p>• Объективная экспертиза</p>
                </>
              )}
              {agent.type === "researcher" && (
                <>
                  <p>• Поиск и анализ информации</p>
                  <p>• Работа с различными источниками</p>
                  <p>• Верификация данных</p>
                  <p>• Создание исследовательских отчетов</p>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Использовать агента
            </Button>
            <Button variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Дублировать
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};