import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Brain, Lightbulb, Code, Gavel, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const agentTypes = [
  { value: "analyst", label: "Аналитик", icon: Brain, description: "Анализ данных и выявление закономерностей" },
  { value: "creative", label: "Творческий", icon: Lightbulb, description: "Генерация креативных идей" },
  { value: "technical", label: "Технический", icon: Code, description: "Техническая экспертиза" },
  { value: "judge", label: "Судья", icon: Gavel, description: "Оценка и принятие решений" },
  { value: "researcher", label: "Исследователь", icon: Search, description: "Поиск и анализ информации" }
];

export const CreateAgentDialog = () => {
  const [open, setOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const { toast } = useToast();

  const handleCreateAgent = () => {
    if (!agentName || !agentType || !agentDescription || !agentPrompt) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive"
      });
      return;
    }

    // Here would be the logic to create the agent in Supabase
    console.log("Creating agent:", {
      name: agentName,
      type: agentType,
      description: agentDescription,
      prompt: agentPrompt
    });

    toast({
      title: "Агент создан",
      description: `Агент "${agentName}" успешно создан и добавлен в ваш маркетплейс`
    });

    setOpen(false);
    // Reset form
    setAgentName("");
    setAgentType("");
    setAgentDescription("");
    setAgentPrompt("");
  };

  const selectedType = agentTypes.find(type => type.value === agentType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Создать агента
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание нового AI-агента</DialogTitle>
          <DialogDescription>
            Создайте собственного AI-агента с уникальным промптом и поведением
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Agent Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent-name">Название агента</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Например: Эксперт по маркетингу"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="agent-type">Тип агента</Label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите тип агента" />
                </SelectTrigger>
                <SelectContent>
                  {agentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedType && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <selectedType.icon className="w-4 h-4" />
                    <Badge variant="outline">{selectedType.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="agent-description">Описание</Label>
              <Textarea
                id="agent-description"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                placeholder="Опишите, что умеет ваш агент и для каких задач он предназначен..."
                className="mt-1 min-h-20"
              />
            </div>
            
            <div>
              <Label htmlFor="agent-prompt">Системный промпт</Label>
              <Textarea
                id="agent-prompt"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="Введите системный промпт, который определяет поведение и роль вашего агента..."
                className="mt-1 min-h-32 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Промпт определяет как агент будет вести себя и отвечать на запросы
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateAgent}
              disabled={!agentName || !agentType || !agentDescription || !agentPrompt}
              className="bg-gradient-ai border-0"
            >
              Создать агента
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};