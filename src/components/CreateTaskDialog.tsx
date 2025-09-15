import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AgentCard } from "./AgentCard";
import { PlusCircle, Upload } from "lucide-react";

const availableAgents = [
  {
    id: "1",
    name: "Аналитик Pro",
    type: "analyst",
    description: "Глубокий анализ данных, выявление трендов и закономерностей",
    rating: 4.8,
    usageCount: 1247
  },
  {
    id: "2",
    name: "Творческий Гений",
    type: "creative",
    description: "Генерация креативных идей и нестандартных решений",
    rating: 4.9,
    usageCount: 892
  },
  {
    id: "3",
    name: "Техно-Эксперт",
    type: "technical",
    description: "Техническая экспертиза и решение сложных технических задач",
    rating: 4.7,
    usageCount: 654
  },
  {
    id: "4",
    name: "Судья",
    type: "judge",
    description: "Оценка результатов работы агентов и формирование итогового решения",
    rating: 4.9,
    usageCount: 2156
  },
  {
    id: "5",
    name: "Исследователь",
    type: "researcher",
    description: "Поиск и анализ информации из различных источников",
    rating: 4.6,
    usageCount: 987
  }
];

export const CreateTaskDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleCreateTask = () => {
    // Here would be the logic to create the task
    console.log("Creating task:", {
      title: taskTitle,
      description: taskDescription,
      agents: selectedAgents
    });
    setOpen(false);
    // Reset form
    setTaskTitle("");
    setTaskDescription("");
    setSelectedAgents([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-ai border-0">
          <PlusCircle className="w-4 h-4 mr-2" />
          Новая задача
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание новой задачи</DialogTitle>
          <DialogDescription>
            Опишите задачу и выберите агентов для её решения
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Task Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Название задачи</Label>
              <Input
                id="title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Например: Анализ конкурентов"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Описание и цели</Label>
              <Textarea
                id="description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Опишите что нужно сделать, какие цели достичь..."
                className="mt-1 min-h-24"
              />
            </div>
            
            <div>
              <Label>Входные данные</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Выбрать файлы
                </Button>
              </div>
            </div>
          </div>
          
          {/* Agent Selection */}
          <div className="space-y-4">
            <div>
              <Label>Выберите агентов ({selectedAgents.length} выбрано)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Рекомендуется выбрать 2-4 агента для эффективной работы
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  {...agent}
                  isSelected={selectedAgents.includes(agent.id)}
                  onSelect={handleAgentSelect}
                />
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={!taskTitle || selectedAgents.length === 0}
              className="bg-gradient-ai border-0"
            >
              Создать задачу
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};