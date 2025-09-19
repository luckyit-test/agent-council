import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Tag,
  Save,
  Trash2,
  Globe,
  BookOpen,
  Zap,
  Shield
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { updateUserAgent, removeUserAgent } from "@/utils/agentStorage";

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
  isCustom?: boolean;
  aiProvider?: string;
  aiModel?: string;
  capabilities?: {
    webSearch?: boolean;
    deepResearch?: boolean;
  };
}

interface AgentDetailDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentUpdated?: () => void;
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

export const AgentDetailDialog = ({ agent, open, onOpenChange, onAgentUpdated }: AgentDetailDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAgent, setEditedAgent] = useState<Agent | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
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
    // OpenAI и Perplexity всегда доступны через Supabase
    const supabaseProviders = ['openai', 'perplexity'];
    const allConfigured = [...new Set([...configured, ...supabaseProviders])];
    
    setConfiguredProviders(allConfigured);
  }, [open]);

  useEffect(() => {
    if (agent) {
      setEditedAgent({ ...agent });
      // Автоматически включить режим редактирования для своих агентов
      setIsEditing(agent.isCustom || false);
      setErrors({});
    }
  }, [agent]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!editedAgent?.name?.trim()) {
      newErrors.name = 'Название обязательно';
    }
    if (!editedAgent?.type) {
      newErrors.type = 'Выберите тип агента';
    }
    if (!editedAgent?.description?.trim()) {
      newErrors.description = 'Описание обязательно';
    }
    if (!editedAgent?.prompt?.trim()) {
      newErrors.prompt = 'Промпт обязателен';
    } else if (editedAgent.prompt.length < 10) {
      newErrors.prompt = 'Промпт должен содержать минимум 10 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editedAgent || !agent || !validateForm()) return;
    
    const success = updateUserAgent(agent.id, {
      name: editedAgent.name,
      type: editedAgent.type,
      description: editedAgent.description,
      prompt: editedAgent.prompt,
      capabilities: editedAgent.capabilities,
      aiProvider: editedAgent.aiProvider,
      aiModel: editedAgent.aiModel
    });
    
    if (success) {
      toast({
        title: "Агент обновлен",
        description: "Изменения успешно сохранены"
      });
      setIsEditing(false);
      onAgentUpdated?.();
      // Закрываем диалог после успешного сохранения
      onOpenChange(false);
    } else {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!agent) return;
    
    const success = removeUserAgent(agent.id);
    if (success) {
      toast({
        title: "Агент удален",
        description: "Агент удален из ваших агентов"
      });
      onOpenChange(false);
      onAgentUpdated?.();
    } else {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить агента",
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
  };

  const handleCancel = () => {
    if (agent) {
      setEditedAgent({ ...agent });
    }
    setIsEditing(false);
  };
  if (!agent) return null;

  const selectedType = agentTypes.find(type => type.value === editedAgent?.type);
  const availableProviders = aiProviders.filter(provider => configuredProviders.includes(provider.value));
  const selectedProvider = availableProviders.find(provider => provider.value === editedAgent?.aiProvider);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agent?.isCustom ? 'Редактирование агента' : 'Детали агента'}
          </DialogTitle>
          <DialogDescription>
            {agent?.isCustom 
              ? 'Измените настройки и поведение вашего AI-агента'
              : 'Подробная информация об агенте'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Details */}
          <div className="space-y-4">
            {/* Agent Name */}
            <div>
              <Label htmlFor="agent-name">
                Название агента <span className="text-red-500">*</span>
              </Label>
              <Input
                id="agent-name"
                value={editedAgent?.name || ""}
                onChange={(e) => {
                  setEditedAgent(prev => prev ? { ...prev, name: e.target.value } : null);
                  if (errors.name) setErrors(prev => ({...prev, name: ''}));
                }}
                readOnly={!isEditing || !agent?.isCustom}
                className={`mt-1 ${(!isEditing || !agent?.isCustom) ? 'bg-muted/30' : ''} ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Например: Эксперт по маркетингу"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            {/* Agent Type */}
            <div>
              <Label htmlFor="agent-type">
                Тип агента <span className="text-red-500">*</span>
              </Label>
              {isEditing && agent?.isCustom ? (
                <>
                  <Select
                    value={editedAgent?.type || ""}
                    onValueChange={(value) => {
                      setEditedAgent(prev => prev ? { ...prev, type: value } : null);
                      if (errors.type) setErrors(prev => ({...prev, type: ''}));
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.type ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Выберите тип агента" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
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
                  {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                  {selectedType && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <selectedType.icon className="w-4 h-4" />
                        <Badge variant="outline">{selectedType.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                    </div>
                  )}
                </>
              ) : (
                <Input
                  id="agent-type"
                  value={getAgentTypeName(editedAgent?.type || "")}
                  readOnly
                  className="mt-1 bg-muted/30"
                />
              )}
            </div>

            {/* AI Provider Selection */}
            {(isEditing && agent?.isCustom) && (
              <div>
                <Label htmlFor="ai-provider">Нейросеть</Label>
                <Select 
                  value={editedAgent?.aiProvider || ""} 
                  onValueChange={(value) => {
                    setEditedAgent(prev => prev ? { ...prev, aiProvider: value } : null);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите нейросеть" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.length > 0 ? (
                      availableProviders.map((provider) => {
                        const Icon = provider.icon;
                        const getModelLabel = (providerValue: string) => {
                          switch (providerValue) {
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
                        {selectedProvider.value === 'openai' ? 'GPT-5' :
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
            )}
            
            {/* Дополнительные возможности */}
            {(isEditing && agent?.isCustom) && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Дополнительные возможности</Label>
                
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="web-search"
                      checked={editedAgent?.capabilities?.webSearch || false}
                      onCheckedChange={(checked) => {
                        setEditedAgent(prev => prev ? {
                          ...prev,
                          capabilities: {
                            ...prev.capabilities,
                            webSearch: checked as boolean
                          }
                        } : null);
                      }}
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
                      checked={editedAgent?.capabilities?.deepResearch || false}
                      onCheckedChange={(checked) => {
                        setEditedAgent(prev => prev ? {
                          ...prev,
                          capabilities: {
                            ...prev.capabilities,
                            deepResearch: checked as boolean
                          }
                        } : null);
                      }}
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
            )}

            {/* Agent Description */}
            <div>
              <Label htmlFor="agent-description">
                Описание <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="agent-description"
                value={editedAgent?.description || ""}
                onChange={(e) => {
                  setEditedAgent(prev => prev ? { ...prev, description: e.target.value } : null);
                  if (errors.description) setErrors(prev => ({...prev, description: ''}));
                }}
                readOnly={!isEditing || !agent?.isCustom}
                className={`mt-1 min-h-20 ${(!isEditing || !agent?.isCustom) ? 'bg-muted/30' : ''} ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Опишите, что умеет ваш агент и для каких задач он предназначен..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            
            {/* System Prompt */}
            {editedAgent?.prompt !== undefined && (
              <div>
                <Label htmlFor="agent-prompt">
                  Системный промпт <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="agent-prompt"
                  value={editedAgent.prompt}
                  onChange={(e) => {
                    setEditedAgent(prev => prev ? { ...prev, prompt: e.target.value } : null);
                    if (errors.prompt) setErrors(prev => ({...prev, prompt: ''}));
                  }}
                  readOnly={!isEditing || !agent?.isCustom}
                  className={`mt-1 min-h-32 font-mono text-sm ${(!isEditing || !agent?.isCustom) ? 'bg-muted/30' : ''} ${errors.prompt ? 'border-red-500' : ''}`}
                  placeholder="Введите системный промпт, который определяет поведение и роль вашего агента..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.prompt ? (
                    <p className="text-red-500 text-xs">{errors.prompt}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Промпт определяет как агент будет вести себя и отвечать на запросы (минимум 10 символов)
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {editedAgent.prompt?.length || 0} символов
                  </span>
                </div>
              </div>
            )}

            {/* Capabilities Display for non-custom agents */}
            {(!isEditing || !agent?.isCustom) && (editedAgent?.capabilities?.webSearch || editedAgent?.capabilities?.deepResearch) && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Возможности агента</Label>
                <div className="space-y-2">
                  {editedAgent?.capabilities?.webSearch && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Web Search</span>
                    </div>
                  )}
                  {editedAgent?.capabilities?.deepResearch && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span>Deep Research</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {(agent?.author || agent?.tags) && (
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
          {agent?.usageCount && (
            <>
              <Separator />
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold mb-1">{agent.usageCount}</div>
                <p className="text-sm text-muted-foreground">Использований</p>
              </div>
            </>
          )}

          {/* Actions */}
          {agent?.isCustom && (
            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
              
              <div className="flex gap-2">
                {isEditing && (
                  <Button 
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Отмена
                  </Button>
                )}
                <Button 
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={isEditing && (!editedAgent?.name || !editedAgent?.description || !editedAgent?.prompt)}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить изменения
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Редактировать
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog - moved to parent component */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить агента?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы действительно хотите удалить агента "{agent?.name}"? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};