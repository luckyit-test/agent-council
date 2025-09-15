import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { AgentFilters } from "@/components/AgentFilters";
import { AgentSection } from "@/components/AgentSection";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentDetailDialog } from "@/components/AgentDetailDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Zap, Plus } from "lucide-react";

const mockAgents = [
  {
    id: "1",
    name: "Аналитик Pro",
    type: "analyst",
    description: "Глубокий анализ данных, выявление трендов и закономерностей. Способен обрабатывать большие объемы информации и предоставлять детальные отчеты.",
    rating: 4.8,
    usageCount: 1247,
    isCustom: false
  },
  {
    id: "2",
    name: "Творческий Гений",
    type: "creative",
    description: "Генерация креативных идей и нестандартных решений для любых задач. Помогает в создании контента и поиске новых подходов.",
    rating: 4.9,
    usageCount: 892,
    isCustom: false
  },
  {
    id: "3",
    name: "Техно-Эксперт",
    type: "technical",
    description: "Техническая экспертиза и решение сложных технических задач. Специализируется на программировании и системной архитектуре.",
    rating: 4.7,
    usageCount: 654,
    isCustom: false
  },
  {
    id: "4",
    name: "Судья",
    type: "judge",
    description: "Оценка результатов работы агентов и формирование итогового решения. Обеспечивает объективную оценку и качественный анализ.",
    rating: 4.9,
    usageCount: 2156,
    isCustom: false
  },
  {
    id: "5",
    name: "Исследователь",
    type: "researcher",
    description: "Поиск и анализ информации из различных источников. Проводит глубокие исследования и предоставляет структурированные данные.",
    rating: 4.6,
    usageCount: 987,
    isCustom: false
  },
  {
    id: "6",
    name: "Мой Маркетолог",
    type: "creative",
    description: "Специализированный агент для маркетинговых задач и стратегий. Создан для анализа рынка и разработки продвижения.",
    rating: 4.5,
    usageCount: 123,
    isCustom: true
  },
  {
    id: "7",
    name: "Персональный Аналитик",
    type: "analyst",
    description: "Настроенный под мои задачи аналитик для работы с финансовыми данными и бизнес-метриками.",
    rating: 4.3,
    usageCount: 67,
    isCustom: true
  }
];

const Agents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewFilter, setViewFilter] = useState<"all" | "my" | "marketplace">("all");
  const [selectedAgent, setSelectedAgent] = useState<typeof mockAgents[0] | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const filteredAndSortedAgents = useMemo(() => {
    let filtered = mockAgents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           agent.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || agent.type === typeFilter;
      const matchesView = viewFilter === "all" || 
                         (viewFilter === "my" && agent.isCustom) ||
                         (viewFilter === "marketplace" && !agent.isCustom);
      return matchesSearch && matchesType && matchesView;
    });

    // Sort agents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.usageCount - a.usageCount;
        case "rating":
          return b.rating - a.rating;
        case "recent":
          return a.id.localeCompare(b.id); // Simple recent sorting
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, typeFilter, sortBy, viewFilter]);

  const myAgents = filteredAndSortedAgents.filter(agent => agent.isCustom);
  const marketplaceAgents = filteredAndSortedAgents.filter(agent => !agent.isCustom);

  const totalAgents = mockAgents.length;
  const myAgentsCount = mockAgents.filter(agent => agent.isCustom).length;
  const activeAgents = 4; // This could be dynamic based on actual usage

  const handleAgentSelect = (agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setDetailDialogOpen(true);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
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

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего агентов</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgents}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +2 за неделю
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Мои агенты</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myAgentsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Создано вами</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активных</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">Используются в задачах</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Популярность</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(mockAgents.reduce((acc, agent) => acc + agent.rating, 0) / mockAgents.length * 10) / 10}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Средний рейтинг</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Поиск и фильтры</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewFilter={viewFilter}
              onViewFilterChange={setViewFilter}
            />
          </CardContent>
        </Card>

        {/* Agents Sections */}
        <div className="space-y-8">
          {(viewFilter === "all" || viewFilter === "my") && (
            <AgentSection
              title="Мои агенты"
              subtitle="Агенты, созданные и настроенные вами"
              agents={myAgents}
              onAgentSelect={handleAgentSelect}
              defaultExpanded={viewFilter === "my"}
              emptyMessage="У вас пока нет собственных агентов"
            />
          )}

          {(viewFilter === "all" || viewFilter === "marketplace") && (
            <AgentSection
              title="Маркетплейс агентов"
              subtitle="Готовые к использованию профессиональные агенты"
              agents={marketplaceAgents}
              onAgentSelect={handleAgentSelect}
              defaultExpanded={viewFilter === "marketplace"}
              emptyMessage="Агенты из маркетплейса не найдены"
            />
          )}

          {filteredAndSortedAgents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Агенты не найдены</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Попробуйте изменить критерии поиска или создать собственного агента для решения ваших задач
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("all");
                      setViewFilter("all");
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                  <CreateAgentDialog />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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