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
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

interface AgentDetailDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentUpdated?: () => void;
}

const agentTypes = [
  { value: "analyst", label: "Аналитик", icon: Brain },
  { value: "creative", label: "Творческий", icon: Lightbulb },
  { value: "technical", label: "Технический", icon: Code },
  { value: "judge", label: "Судья", icon: Gavel },
  { value: "researcher", label: "Исследователь", icon: Search }
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
  const { toast } = useToast();

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
      prompt: editedAgent.prompt
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getAgentColor(agent.type)}`}>
              {getAgentIcon(agent.type)}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl truncate">
                {agent?.isCustom ? 'Редактирование агента' : 'Детали агента'}
              </DialogTitle>
              <Badge variant="outline" className="text-xs">
                {getAgentTypeName(agent.type)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Agent Information Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent-name" className="text-sm font-medium">
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
            
            <div>
              <Label htmlFor="agent-type" className="text-sm font-medium">
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
            
            <div>
              <Label htmlFor="agent-description" className="text-sm font-medium">
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
            
            {editedAgent?.prompt !== undefined && (
              <div>
                <Label htmlFor="agent-prompt" className="text-sm font-medium">
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
                  className={`mt-1 min-h-24 sm:min-h-32 font-mono text-sm ${(!isEditing || !agent?.isCustom) ? 'bg-muted/30' : ''} ${errors.prompt ? 'border-red-500' : ''}`}
                  placeholder="Введите системный промпт, который определяет поведение вашего агента..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.prompt ? (
                    <p className="text-red-500 text-xs">{errors.prompt}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Промпт определяет как агент будет вести себя и отвечать на запросы
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {editedAgent.prompt?.length || 0} символов
                  </span>
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
            <div className="flex justify-end gap-2 pt-4 mt-6 border-t">
              {isEditing ? (
                <Button 
                  onClick={handleSave}
                  disabled={!editedAgent?.name || !editedAgent?.description || !editedAgent?.prompt}
                  className="w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить изменения
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              )}
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