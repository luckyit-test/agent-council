import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  Clock, 
  Brain, 
  Users, 
  Calendar,
  Timer,
  Eye,
  Play,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const activeTasks = [
  {
    id: 1,
    title: "Анализ конкурентов в сфере FinTech",
    description: "Исследование рынка и составление отчета",
    status: "working",
    progress: 65,
    agents: [
      { name: "Аналитик", type: "analyst", status: "complete" },
      { name: "Исследователь", type: "researcher", status: "working" },
      { name: "Судья", type: "judge", status: "pending" }
    ],
    createdAt: "2 часа назад",
    estimatedTime: "30 мин"
  },
  {
    id: 2,
    title: "Создание маркетинговой стратегии",
    description: "Разработка комплексного плана продвижения",
    status: "pending",
    progress: 0,
    agents: [
      { name: "Творческий", type: "creative", status: "pending" },
      { name: "Аналитик", type: "analyst", status: "pending" },
      { name: "Судья", type: "judge", status: "pending" }
    ],
    createdAt: "30 мин назад",
    estimatedTime: "1 час"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "working":
      return (
        <Badge className="bg-status-working/10 text-status-working border-status-working/20">
          <Clock className="w-3 h-3 mr-1" />
          В работе
        </Badge>
      );
    case "complete":
      return (
        <Badge className="bg-status-complete/10 text-status-complete border-status-complete/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Завершено
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-status-pending/10 text-status-pending border-status-pending/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Ожидает
        </Badge>
      );
    default:
      return null;
  }
};

const getAgentColor = (type: string) => {
  switch (type) {
    case "analyst": return "bg-agent-analyst";
    case "creative": return "bg-agent-creative";
    case "technical": return "bg-agent-technical";
    case "judge": return "bg-agent-judge";
    case "researcher": return "bg-agent-researcher";
    default: return "bg-primary";
  }
};

const getAgentStatus = (status: string) => {
  switch (status) {
    case "working": return "working-glow border-status-working";
    case "complete": return "border-status-complete";
    case "pending": return "border-muted-foreground/30";
    default: return "border-muted-foreground/30";
  }
};

export const Dashboard = () => {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Активные задачи</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <div className="w-10 h-10 bg-gradient-ai rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Агентов работает</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="w-10 h-10 bg-gradient-working rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Завершено сегодня</p>
                <p className="text-2xl font-bold">1</p>
              </div>
              <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Среднее время</p>
                <p className="text-2xl font-bold">45м</p>
              </div>
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Активные задачи</h2>
        <div className="space-y-4">
          {activeTasks.map((task) => (
            <Card key={task.id} className="hover:bg-card/80 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                {task.status === "working" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-medium">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                )}
                
                {/* Agents */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Агенты</p>
                  <div className="flex items-center gap-2">
                    {task.agents.map((agent, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium text-primary-foreground ${getAgentColor(agent.type)} ${getAgentStatus(agent.status)}`}
                        title={`${agent.name} - ${agent.status}`}
                      >
                        {agent.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Создано {task.createdAt}</span>
                    <span>~{task.estimatedTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({
                        title: "Задача открыта",
                        description: `Просмотр задачи: ${task.title}`
                      })}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Просмотр
                    </Button>
                    {task.status === "pending" && (
                      <Button 
                        size="sm" 
                        className="bg-gradient-ai border-0"
                        onClick={() => toast({
                          title: "Задача запущена",
                          description: `Запущена задача: ${task.title}`
                        })}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Запустить
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};