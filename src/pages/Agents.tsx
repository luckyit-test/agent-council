import { useState } from "react";
import { Layout } from "@/components/Layout";
import { AgentCard } from "@/components/AgentCard";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentDetailDialog } from "@/components/AgentDetailDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

const mockAgents = [
  {
    id: "1",
    name: "Аналитик Pro",
    type: "analyst",
    description: "Глубокий анализ данных, выявление трендов и закономерностей",
    rating: 4.8,
    usageCount: 1247,
    isCustom: false
  },
  {
    id: "2",
    name: "Творческий Гений",
    type: "creative",
    description: "Генерация креативных идей и нестандартных решений",
    rating: 4.9,
    usageCount: 892,
    isCustom: false
  },
  {
    id: "3",
    name: "Техно-Эксперт",
    type: "technical",
    description: "Техническая экспертиза и решение сложных технических задач",
    rating: 4.7,
    usageCount: 654,
    isCustom: false
  },
  {
    id: "4",
    name: "Судья",
    type: "judge",
    description: "Оценка результатов работы агентов и формирование итогового решения",
    rating: 4.9,
    usageCount: 2156,
    isCustom: false
  },
  {
    id: "5",
    name: "Исследователь",
    type: "researcher",
    description: "Поиск и анализ информации из различных источников",
    rating: 4.6,
    usageCount: 987,
    isCustom: false
  },
  {
    id: "6",
    name: "Мой Маркетолог",
    type: "creative",
    description: "Специализированный агент для маркетинговых задач и стратегий",
    rating: 4.5,
    usageCount: 123,
    isCustom: true
  }
];

const Agents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<typeof mockAgents[0] | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || agent.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAgentSelect = (agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setDetailDialogOpen(true);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Агенты</h1>
            <p className="text-muted-foreground">
              Управляйте своими AI-агентами и выбирайте из маркетплейса
            </p>
          </div>
          <CreateAgentDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Всего агентов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAgents.length}</div>
              <p className="text-xs text-muted-foreground">+2 за последнюю неделю</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Мои агенты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Создано вами</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Активных</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Используются в задачах</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Поиск и фильтры</CardTitle>
            <CardDescription>
              Найдите нужного агента или создайте собственного
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск агентов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Тип агента" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="analyst">Аналитик</SelectItem>
                  <SelectItem value="creative">Творческий</SelectItem>
                  <SelectItem value="technical">Технический</SelectItem>
                  <SelectItem value="judge">Судья</SelectItem>
                  <SelectItem value="researcher">Исследователь</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              {...agent}
              onSelect={handleAgentSelect}
            />
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">
                Агенты не найдены. Попробуйте изменить критерии поиска.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Agent Detail Dialog */}
        <AgentDetailDialog
          agent={selectedAgent}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </div>
    </Layout>
  );
};

export default Agents;