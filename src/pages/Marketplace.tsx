import { useState, useMemo } from "react";
import { Search, Plus, Heart, Download, Eye } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock marketplace data
const marketplaceAgents = [
  {
    id: "1",
    name: "GPT-4 Аналитик",
    type: "analyst",
    description: "Профессиональный анализ данных и составление отчетов",
    author: "AI Team",
    downloads: 1247,
    rating: 4.8,
    tags: ["анализ", "отчеты", "данные"],
    isPublished: true,
  },
  {
    id: "2", 
    name: "Креативный Писатель",
    type: "creative",
    description: "Создание креативного контента и копирайтинг",
    author: "Content Pro",
    downloads: 856,
    rating: 4.7,
    tags: ["контент", "креатив", "тексты"],
    isPublished: true,
  },
  {
    id: "3",
    name: "Код Ревьюер",
    type: "technical", 
    description: "Анализ кода и рекомендации по улучшению",
    author: "Dev Masters",
    downloads: 2103,
    rating: 4.9,
    tags: ["код", "ревью", "программирование"],
    isPublished: true,
  },
];

const marketplaceBots = [
  {
    id: "1",
    name: "Чат-бот Поддержки",
    type: "support",
    description: "Автоматизация клиентской поддержки",
    author: "Support Team",
    downloads: 3421,
    tags: ["поддержка", "чат", "клиенты"],
  },
];

const marketplaceTasks = [
  {
    id: "1", 
    name: "Анализ Конкурентов",
    type: "analysis",
    description: "Комплексный анализ конкурентов и рынка",
    author: "Business Analyst",
    downloads: 892,
    tags: ["конкуренты", "анализ", "маркетинг"],
  },
];

const typeColors = {
  analyst: "bg-blue-100 text-blue-800",
  creative: "bg-purple-100 text-purple-800", 
  technical: "bg-green-100 text-green-800",
  support: "bg-orange-100 text-orange-800",
  analysis: "bg-indigo-100 text-indigo-800",
};

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("agents");

  const filteredAgents = useMemo(() => {
    return marketplaceAgents.filter(agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const filteredBots = useMemo(() => {
    return marketplaceBots.filter(bot =>
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredTasks = useMemo(() => {
    return marketplaceTasks.filter(task =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleAddToMyAgents = (item: any) => {
    // TODO: Implement adding to user's agents
    console.log("Adding to my agents:", item);
  };

  const MarketplaceCard = ({ item, type }: { item: any; type: string }) => (
    <Card className="hover:shadow-lg transition-all duration-200 hover-scale">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
            <CardDescription className="text-sm mb-2">{item.description}</CardDescription>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs">{item.author[0]}</AvatarFallback>
              </Avatar>
              <span>by {item.author}</span>
            </div>
          </div>
          <Badge className={typeColors[item.type as keyof typeof typeColors]}>
            {item.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags?.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>{item.downloads || 0}</span>
            </div>
            {item.rating && (
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span>{item.rating}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              Просмотр
            </Button>
            <Button size="sm" onClick={() => handleAddToMyAgents(item)}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Маркетплейс</h1>
            <p className="text-muted-foreground mt-1">
              Готовые агенты, боты и задачи для вашего использования
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск в маркетплейсе..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="agents">
              Агенты ({filteredAgents.length})
            </TabsTrigger>
            <TabsTrigger value="bots">
              Боты ({filteredBots.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Задачи ({filteredTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <MarketplaceCard key={agent.id} item={agent} type="agent" />
              ))}
            </div>
            {filteredAgents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Агенты не найдены</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bots" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBots.map((bot) => (
                <MarketplaceCard key={bot.id} item={bot} type="bot" />
              ))}
            </div>
            {filteredBots.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Боты не найдены</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <MarketplaceCard key={task.id} item={task} type="task" />
              ))}
            </div>
            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Задачи не найдены</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}