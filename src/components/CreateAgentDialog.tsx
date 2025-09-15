import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Brain, Lightbulb, Code, Gavel, Search, Zap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createCustomAgent } from "@/utils/agentStorage";

interface CreateAgentDialogProps {
  onAgentCreated?: () => void;
}

const agentTypes = [
  { value: "analyst", label: "Аналитик", icon: Brain, description: "Анализ данных и выявление закономерностей" },
  { value: "creative", label: "Творческий", icon: Lightbulb, description: "Генерация креативных идей" },
  { value: "technical", label: "Технический", icon: Code, description: "Техническая экспертиза" },
  { value: "judge", label: "Судья", icon: Gavel, description: "Оценка и принятие решений" },
  { value: "researcher", label: "Исследователь", icon: Search, description: "Поиск и анализ информации" }
];

const aiProviders = [
  { 
    value: "openai", 
    label: "OpenAI", 
    icon: Zap,
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" }
    ]
  },
  { 
    value: "anthropic", 
    label: "Anthropic", 
    icon: Shield,
    models: [
      { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-opus", label: "Claude 3 Opus" },
      { value: "claude-3-haiku", label: "Claude 3 Haiku" }
    ]
  },
  { 
    value: "google", 
    label: "Google AI", 
    icon: Brain,
    models: [
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" }
    ]
  }
];

export const CreateAgentDialog = ({ onAgentCreated }: CreateAgentDialogProps = {}) => {
  const [open, setOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState("");
  const [aiModel, setAiModel] = useState("");
  const { toast } = useToast();

  const handleCreateAgent = () => {
    if (!agentName || !agentType || !agentDescription || !agentPrompt || !aiProvider || !aiModel) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive"
      });
      return;
    }

    if (agentPrompt.length < 10) {
      toast({
        title: "Ошибка",
        description: "Промпт должен содержать не менее 10 символов",
        variant: "destructive"
      });
      return;
    }

    const success = createCustomAgent({
      name: agentName,
      type: agentType,
      description: agentDescription,
      prompt: agentPrompt,
      aiProvider,
      aiModel
    });

    if (success) {
      toast({
        title: "Агент создан",
        description: `Агент "${agentName}" успешно создан и добавлен в ваши агенты`
      });

      setOpen(false);
      // Reset form
      setAgentName("");
      setAgentType("");
      setAgentDescription("");
      setAgentPrompt("");
      setAiProvider("");
      setAiModel("");
      
      // Notify parent component
      onAgentCreated?.();
    } else {
      toast({
        title: "Ошибка",
        description: "Не удалось создать агента",
        variant: "destructive"
      });
    }
  };

  const selectedType = agentTypes.find(type => type.value === agentType);
  const selectedProvider = aiProviders.find(provider => provider.value === aiProvider);
  const availableModels = selectedProvider?.models || [];

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
                Промпт определяет как агент будет вести себя и отвечать на запросы (минимум 10 символов)
              </p>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">
                  {agentPrompt.length} символов
                </span>
              </div>
            </div>

            {/* AI Provider Selection */}
            <div>
              <Label htmlFor="ai-provider">Нейросеть</Label>
              <Select value={aiProvider} onValueChange={(value) => {
                setAiProvider(value);
                setAiModel(""); // Reset model when provider changes
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите нейросеть" />
                </SelectTrigger>
                <SelectContent>
                  {aiProviders.map((provider) => {
                    const Icon = provider.icon;
                    return (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{provider.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* AI Model Selection */}
            {selectedProvider && (
              <div>
                <Label htmlFor="ai-model">Модель</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите модель" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <selectedProvider.icon className="w-4 h-4" />
                    <Badge variant="outline">{selectedProvider.label}</Badge>
                    {aiModel && (
                      <Badge variant="secondary" className="text-xs">
                        {availableModels.find(m => m.value === aiModel)?.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Агент будет использовать выбранную модель для генерации ответов
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateAgent}
              disabled={!agentName || !agentType || !agentDescription || !agentPrompt || !aiProvider || !aiModel || agentPrompt.length < 10}
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