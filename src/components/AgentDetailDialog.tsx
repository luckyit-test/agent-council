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
  const { toast } = useToast();

  useEffect(() => {
    if (agent) {
      setEditedAgent({ ...agent });
      setIsEditing(false);
    }
  }, [agent]);

  const handleSave = async () => {
    if (!editedAgent || !agent) return;
    
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
          {/* Agent Information Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent-name">Название агента</Label>
              <Input
                id="agent-name"
                value={editedAgent?.name || ""}
                onChange={(e) => setEditedAgent(prev => prev ? { ...prev, name: e.target.value } : null)}
                readOnly={!isEditing || !agent?.isCustom}
                className={`mt-1 ${(!isEditing || !agent?.isCustom) ? 'bg-muted/30' : ''}`}
              />
            </div>
            
            <div>
              <Label htmlFor="agent-type">Тип агента</Label>
              {isEditing && agent?.isCustom ? (
                <Select
                  value={editedAgent?.type || ""}
                  onValueChange={(value) => setEditedAgent(prev => prev ? { ...prev, type: value } : null)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
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
              <Label htmlFor="agent-description">Описание</Label>
              <Textarea
                id="agent-description"
                value={editedAgent?.description || ""}
                onChange={(e) => setEditedAgent(prev => prev ? { ...prev, description: e.target.value } : null)}
                readOnly={!isEditing || !agent?.isCustom}
                className={`mt-1 min-h-20 ${(!isEditing || !agent?.isCustom) ? 'bg-muted/30' : ''}`}
              />
            </div>
            
            {editedAgent?.prompt && (
              <div>
                <Label htmlFor="agent-prompt">Системный промпт</Label>
                <Textarea
                  id="agent-prompt"
                  value={editedAgent.prompt}
                  onChange={(e) => setEditedAgent(prev => prev ? { ...prev, prompt: e.target.value } : null)}
                  readOnly={!isEditing || !agent?.isCustom}
                  className={`mt-1 min-h-32 font-mono text-sm ${(!isEditing || !agent?.isCustom) ? 'bg-muted/30' : ''}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Промпт определяет как агент будет вести себя и отвечать на запросы
                </p>
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
          {(agent?.rating || agent?.usageCount) && (
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

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            {agent?.isCustom ? (
              <>
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Отмена
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setIsEditing(true)} className="flex-1">
                      <Settings className="w-4 h-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Использовать агента
              </Button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
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