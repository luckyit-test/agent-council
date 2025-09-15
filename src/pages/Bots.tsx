import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Play, Pause, Settings, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const mockBots = [
  {
    id: "1",
    name: "Автоматический Аналитик",
    description: "Ежедневный анализ метрик и отчетность",
    status: "running",
    tasksCompleted: 45,
    lastActive: "2 минуты назад",
    agents: ["Аналитик Pro", "Исследователь"]
  },
  {
    id: "2", 
    name: "Креативный Ассистент",
    description: "Генерация контента для социальных сетей",
    status: "paused",
    tasksCompleted: 23,
    lastActive: "1 час назад",
    agents: ["Творческий Гений", "Маркетолог"]
  },
  {
    id: "3",
    name: "Техническая Поддержка",
    description: "Автоматические ответы на технические вопросы",
    status: "stopped",
    tasksCompleted: 67,
    lastActive: "3 дня назад",
    agents: ["Техно-Эксперт", "Судья"]
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "running":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Активен</Badge>;
    case "paused":
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Приостановлен</Badge>;
    case "stopped":
      return <Badge variant="secondary">Остановлен</Badge>;
    default:
      return <Badge variant="outline">Неизвестно</Badge>;
  }
};

const Bots = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Боты</h1>
          <p className="text-muted-foreground">
            Автоматизированные системы для выполнения регулярных задач
          </p>
        </div>
        <Button className="bg-gradient-ai border-0">
          <Bot className="w-4 h-4 mr-2" />
          Создать бота
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего ботов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBots.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активных</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockBots.filter(bot => bot.status === "running").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Задач выполнено</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockBots.reduce((sum, bot) => sum + bot.tasksCompleted, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Экономия времени</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24ч</div>
            <p className="text-xs text-muted-foreground">За последний месяц</p>
          </CardContent>
        </Card>
      </div>

      {/* Bots List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockBots.map((bot) => (
          <Card key={bot.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-ai rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <CardDescription>{bot.description}</CardDescription>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Настроить
                    </DropdownMenuItem>
                    <DropdownMenuItem>Дублировать</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(bot.status)}
                  <span className="text-sm text-muted-foreground">
                    Последняя активность: {bot.lastActive}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Задач выполнено: <strong>{bot.tasksCompleted}</strong></span>
                  <span>Агентов: <strong>{bot.agents.length}</strong></span>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Используемые агенты:</p>
                  <div className="flex flex-wrap gap-1">
                    {bot.agents.map((agent, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  {bot.status === "running" ? (
                    <Button variant="outline" size="sm">
                      <Pause className="w-3 h-3 mr-1" />
                      Пауза
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Play className="w-3 h-3 mr-1" />
                      Запустить
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Settings className="w-3 h-3 mr-1" />
                    Настроить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mockBots.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">Пока нет ботов</CardTitle>
            <CardDescription className="mb-4">
              Создайте своего первого бота для автоматизации рутинных задач
            </CardDescription>
            <Button className="bg-gradient-ai border-0">
              <Bot className="w-4 h-4 mr-2" />
              Создать первого бота
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Bots;