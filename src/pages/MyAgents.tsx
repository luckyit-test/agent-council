import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { AgentCard } from "@/components/AgentCard";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentDetailDialog } from "@/components/AgentDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users } from "lucide-react";

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

const MyAgents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<typeof mockAgents[0] | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const filteredAgents = useMemo(() => {
    return mockAgents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           agent.description.toLowerCase().includes(searchQuery.toLowerCase());
      // Показываем только пользовательские агенты (isCustom: true)
      return matchesSearch && agent.isCustom;
    });
  }, [searchQuery]);

  const handleAgentSelect = (agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setDetailDialogOpen(true);
    }
  };

  const handleAgentEdit = (agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setDetailDialogOpen(true);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Мои агенты</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ваши персональные агенты и добавленные из маркетплейса
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Поиск ваших агентов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>

        {/* Agents List */}
        {filteredAgents.length > 0 ? (
          <div className="space-y-4">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                {...agent}
                onSelect={handleAgentSelect}
                onEdit={handleAgentEdit}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "Агенты не найдены" : "Нет агентов"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery 
                  ? "Попробуйте изменить поисковый запрос или выбрать другую категорию"
                  : "Создайте своего первого агента или выберите из маркетплейса"
                }
              </p>
              <div className="flex gap-3">
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                  >
                    Очистить поиск
                  </Button>
                )}
                <CreateAgentDialog />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Agent CTA */}
        {filteredAgents.length > 0 && (
          <div className="text-center pt-8">
            <CreateAgentDialog />
          </div>
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

export default MyAgents;