import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Brain, Lightbulb, Code, Gavel, Search, Zap, Shield, Globe, BookOpen } from "lucide-react";
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
    value: "lovable", 
    label: "Lovable AI (Gemini)", 
    icon: Brain,
    models: [
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" }
    ]
  },
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
      { value: "claude-opus-4-1-20250805", label: "Claude 4 Opus" },
      { value: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet" },
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" }
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
  },
  { 
    value: "perplexity", 
    label: "Perplexity", 
    icon: Search,
    models: [
      { value: "sonar", label: "Sonar (быстрая модель)" },
      { value: "sonar-pro", label: "Sonar Pro (продвинутая)" },
      { value: "sonar-reasoning", label: "Sonar Reasoning (рассуждения)" },
      { value: "sonar-reasoning-pro", label: "Sonar Reasoning Pro" },
      { value: "sonar-deep-research", label: "Sonar Deep Research" }
    ]
  }
];

export const CreateAgentDialog = ({ onAgentCreated }: CreateAgentDialogProps = {}) => {
  const [open, setOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState("lovable"); // Default to Lovable AI
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableDeepResearch, setEnableDeepResearch] = useState(false);
  const { toast } = useToast();

  // Загружаем список настроенных провайдеров
  useEffect(() => {
    const savedKeys = localStorage.getItem('ai-api-keys');
    let configured = [];
    
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        configured = Object.keys(keys).filter(key => keys[key]);
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    }
    
    // Добавляем провайдеров, которые настроены в Supabase secrets
    // Lovable AI всегда доступен (встроенный)
    // OpenAI и Perplexity доступны через настройки API ключей
    const supabaseProviders = ['lovable', 'openai', 'perplexity'];
    const allConfigured = [...new Set([...configured, ...supabaseProviders])];
    
    setConfiguredProviders(allConfigured);
  }, [open]);

  const handleCreateAgent = () => {
    if (!agentName || !agentType || !agentDescription || !agentPrompt || !aiProvider) {
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

    // Определяем модель по провайдеру
    const getDefaultModel = (provider: string) => {
      switch (provider) {
        case 'lovable':
          return 'google/gemini-2.5-pro';
        case 'openai':
          return 'gpt-5-2025-08-07';
        case 'anthropic':
          return 'claude-opus-4-1-20250805';
        case 'google':
          return 'gemini-1.5-pro';
        case 'perplexity':
          return 'sonar-pro';
        default:
          return 'google/gemini-2.5-pro';
      }
    };

    const success = createCustomAgent({
      name: agentName,
      type: agentType,
      description: agentDescription,
      prompt: agentPrompt,
      aiProvider,
      aiModel: getDefaultModel(aiProvider),
      capabilities: {
        webSearch: enableWebSearch,
        deepResearch: enableDeepResearch
      }
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
      setEnableWebSearch(false);
      setEnableDeepResearch(false);
      
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
  const availableProviders = aiProviders.filter(provider => configuredProviders.includes(provider.value));
  const selectedProvider = availableProviders.find(provider => provider.value === aiProvider);

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
            
            {/* AI Provider Selection */}
            <div>
              <Label htmlFor="ai-provider">Нейросеть</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите нейросеть" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.length > 0 ? (
                    availableProviders.map((provider) => {
                      const Icon = provider.icon;
                      const getModelLabel = (providerValue: string) => {
                        switch (providerValue) {
                          case 'lovable': return 'Gemini 2.5 Pro';
                          case 'openai': return 'GPT-5';
                          case 'anthropic': return 'Claude 4 Opus';
                          case 'google': return 'Gemini 1.5 Pro';
                          case 'perplexity': return 'Sonar Pro';
                          default: return 'По умолчанию';
                        }
                      };
                      
                      return (
                        <SelectItem key={provider.value} value={provider.value}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{provider.label}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs ml-2">
                              {getModelLabel(provider.value)}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Настройте API-ключи в разделе "API Ключи"
                    </div>
                  )}
                </SelectContent>
              </Select>
              {availableProviders.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Нет настроенных нейросетей. Перейдите в раздел "API Ключи" для настройки.
                </p>
              )}
              {selectedProvider && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <selectedProvider.icon className="w-4 h-4" />
                    <Badge variant="outline">{selectedProvider.label}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      {selectedProvider.value === 'lovable' ? 'Gemini 2.5 Pro' :
                       selectedProvider.value === 'openai' ? 'GPT-5' :
                       selectedProvider.value === 'anthropic' ? 'Claude 4 Opus' :
                       selectedProvider.value === 'google' ? 'Gemini 1.5 Pro' :
                       selectedProvider.value === 'perplexity' ? 'Sonar Pro' : 'По умолчанию'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Агент будет использовать лучшую модель для выбранного провайдера
                  </p>
                </div>
              )}
            </div>
            
            {/* Дополнительные возможности */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Дополнительные возможности</Label>
              
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="web-search"
                    checked={enableWebSearch}
                    onCheckedChange={(checked) => setEnableWebSearch(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="web-search" className="font-medium cursor-pointer">
                        Web Search
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Агент сможет искать актуальную информацию в интернете в реальном времени
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="deep-research"
                    checked={enableDeepResearch}
                    onCheckedChange={(checked) => setEnableDeepResearch(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <Label htmlFor="deep-research" className="font-medium cursor-pointer">
                        Deep Research
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Агент будет проводить глубокое исследование темы с анализом множества источников
                    </p>
                  </div>
                </div>
                
              </div>
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
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateAgent}
              disabled={!agentName || !agentType || !agentDescription || !agentPrompt || !aiProvider || agentPrompt.length < 10 || availableProviders.length === 0}
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