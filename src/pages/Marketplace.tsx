import { useState, useMemo } from "react";
import { Search, Plus, Heart, Download, Eye } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock marketplace data - витрина примеров
const marketplaceAgents = [
  // Аналитические агенты
  {
    id: "1",
    name: "Финансовый Аналитик",
    type: "analyst",
    category: "Аналитические",
    description: "Анализ финансовых отчетов, прогнозирование и оценка рисков",
    author: "AI Finance Team",
    tags: ["финансы", "отчеты", "прогнозы"],
    capabilities: "Анализирует P&L, баланс, денежные потоки",
  },
  {
    id: "2",
    name: "Маркетинг Аналитик",
    type: "analyst", 
    category: "Аналитические",
    description: "Анализ эффективности маркетинговых кампаний и ROI",
    author: "Marketing Pro",
    tags: ["маркетинг", "ROI", "кампании"],
    capabilities: "Оценивает CAC, LTV, конверсии каналов",
  },
  {
    id: "3",
    name: "Веб-Аналитик",
    type: "analyst",
    category: "Аналитические", 
    description: "Анализ поведения пользователей и UX метрик",
    author: "UX Analytics",
    tags: ["веб-аналитика", "UX", "поведение"],
    capabilities: "GA4, Яндекс.Метрика, тепловые карты",
  },
  {
    id: "4",
    name: "HR Аналитик",
    type: "analyst",
    category: "Аналитические",
    description: "Анализ HR метрик, текучести и вовлеченности",
    author: "HR Tech",
    tags: ["HR", "персонал", "метрики"],
    capabilities: "Turnover, engagement, performance analysis",
  },
  {
    id: "5",
    name: "Продуктовый Аналитик",
    type: "analyst",
    category: "Аналитические", 
    description: "Анализ продуктовых метрик и пользовательского опыта",
    author: "Product Team",
    tags: ["продукт", "метрики", "аналитика"],
    capabilities: "Retention, activation, feature analysis",
  },

  // Креативные агенты
  {
    id: "6",
    name: "Копирайтер Pro",
    type: "creative",
    category: "Креативные",
    description: "Создание продающих текстов и контента для разных каналов",
    author: "Content Studio", 
    tags: ["копирайтинг", "контент", "продажи"],
    capabilities: "Лендинги, email-рассылки, соцсети",
  },
  {
    id: "7",
    name: "Креативный Директор",
    type: "creative",
    category: "Креативные",
    description: "Генерация креативных концепций и идей для кампаний",
    author: "Creative Agency",
    tags: ["креатив", "концепции", "идеи"],
    capabilities: "Brainstorming, concept development, campaigns",
  },
  {
    id: "8", 
    name: "SMM Менеджер",
    type: "creative",
    category: "Креативные",
    description: "Контент-план и посты для социальных сетей",
    author: "Social Media Pro",
    tags: ["SMM", "соцсети", "контент-план"],
    capabilities: "Instagram, Telegram, VK, LinkedIn",
  },
  {
    id: "9",
    name: "Видео Сценарист", 
    type: "creative",
    category: "Креативные",
    description: "Написание сценариев для видео и рекламных роликов",
    author: "Video Production",
    tags: ["видео", "сценарии", "реклама"],
    capabilities: "YouTube, TikTok, рекламные ролики",
  },

  // Технические агенты
  {
    id: "10",
    name: "Code Reviewer",
    type: "technical", 
    category: "Технические",
    description: "Анализ кода и рекомендации по улучшению архитектуры",
    author: "Dev Team",
    tags: ["код", "ревью", "архитектура"],
    capabilities: "Python, JavaScript, security, performance",
  },
  {
    id: "11",
    name: "DevOps Помощник",
    type: "technical",
    category: "Технические",
    description: "Настройка CI/CD, контейнеризация и мониторинг",
    author: "DevOps Pro",
    tags: ["DevOps", "CI/CD", "мониторинг"], 
    capabilities: "Docker, K8s, AWS, monitoring setup",
  },
  {
    id: "12",
    name: "Database Architect",
    type: "technical",
    category: "Технические", 
    description: "Проектирование баз данных и оптимизация запросов",
    author: "DB Expert",
    tags: ["база данных", "SQL", "оптимизация"],
    capabilities: "PostgreSQL, MySQL, query optimization",
  },
  {
    id: "13", 
    name: "API Designer",
    type: "technical",
    category: "Технические",
    description: "Проектирование REST API и документации",
    author: "API Team",
    tags: ["API", "REST", "документация"],
    capabilities: "OpenAPI, REST design, documentation",
  },
  {
    id: "14",
    name: "QA Инженер",
    type: "technical",
    category: "Технические",
    description: "Составление тест-кейсов и автоматизация тестирования",
    author: "QA Team", 
    tags: ["тестирование", "QA", "автоматизация"],
    capabilities: "Test cases, automation, bug detection",
  },
  {
    id: "15",
    name: "Security Аудитор",
    type: "technical",
    category: "Технические",
    description: "Анализ безопасности кода и инфраструктуры",
    author: "Security Team",
    tags: ["безопасность", "аудит", "уязвимости"],
    capabilities: "OWASP, penetration testing, compliance",
  }
];

const marketplaceBots = [
  {
    id: "1",
    name: "Чат-бот Поддержки",
    type: "support",
    category: "Клиентский сервис",
    description: "Автоматизация ответов на частые вопросы клиентов",
    author: "Support Team",
    tags: ["поддержка", "FAQ", "клиенты"],
    capabilities: "Telegram, WhatsApp, веб-чат интеграция",
  },
  {
    id: "2", 
    name: "Продажный Бот",
    type: "sales",
    category: "Продажи",
    description: "Квалификация лидов и предварительные продажи",
    author: "Sales Team",
    tags: ["продажи", "лиды", "квалификация"],
    capabilities: "Lead scoring, appointment booking, CRM sync",
  },
  {
    id: "3",
    name: "HR Рекрутер Бот", 
    type: "hr",
    category: "HR и Рекрутинг",
    description: "Первичный скрининг кандидатов и планирование интервью",
    author: "HR Tech",
    tags: ["рекрутинг", "скрининг", "интервью"],
    capabilities: "CV parsing, interview scheduling, candidate scoring", 
  },
  {
    id: "4",
    name: "Образовательный Бот",
    type: "education", 
    category: "Обучение",
    description: "Интерактивные курсы и проверка знаний",
    author: "EdTech Team",
    tags: ["обучение", "курсы", "тестирование"],
    capabilities: "Quiz creation, progress tracking, certificates",
  }
];

const marketplaceTasks = [
  // Маркетинг
  {
    id: "1",
    name: "Анализ Конкурентов",
    type: "analysis",
    category: "Маркетинг",
    description: "Комплексный анализ конкурентов и их стратегий",
    author: "Marketing Analytics",
    tags: ["конкуренты", "анализ", "стратегия"],
    capabilities: "Позиционирование, цены, каналы, контент-анализ",
  },
  {
    id: "2", 
    name: "Исследование ЦА",
    type: "research",
    category: "Маркетинг",
    description: "Глубокое исследование целевой аудитории",
    author: "UX Research",
    tags: ["ЦА", "исследование", "персоны"],
    capabilities: "Интервью, опросы, персоны, customer journey",
  },
  {
    id: "3",
    name: "Контент-стратегия",
    type: "strategy", 
    category: "Маркетинг",
    description: "Разработка контент-стратегии для всех каналов",
    author: "Content Strategy",
    tags: ["контент", "стратегия", "каналы"],
    capabilities: "Content audit, planning, calendar, distribution",
  },
  {
    id: "4",
    name: "SEO Аудит",
    type: "audit",
    category: "Маркетинг", 
    description: "Технический и контентный SEO аудит сайта",
    author: "SEO Expert",
    tags: ["SEO", "аудит", "оптимизация"],
    capabilities: "Technical SEO, content optimization, link building",
  },
  {
    id: "5",
    name: "Email Кампания",
    type: "campaign",
    category: "Маркетинг",
    description: "Настройка эффективных email маркетинг кампаний", 
    author: "Email Marketing",
    tags: ["email", "кампании", "автоматизация"],
    capabilities: "Segmentation, automation, A/B testing, analytics",
  },

  // Продукт
  {
    id: "6",
    name: "Продуктовое Исследование",
    type: "research",
    category: "Продукт",
    description: "Исследование пользователей и валидация гипотез",
    author: "Product Research",
    tags: ["исследование", "пользователи", "гипотезы"],
    capabilities: "User interviews, surveys, usability testing",
  },
  {
    id: "7",
    name: "Roadmap Planning", 
    type: "planning",
    category: "Продукт",
    description: "Создание продуктовой дорожной карты",
    author: "Product Management",
    tags: ["roadmap", "планирование", "приоритизация"],
    capabilities: "Feature prioritization, timeline planning, OKRs",
  },
  {
    id: "8",
    name: "A/B Тестирование",
    type: "testing",
    category: "Продукт",
    description: "Дизайн и анализ A/B тестов",
    author: "Growth Team", 
    tags: ["A/B тесты", "эксперименты", "конверсия"],
    capabilities: "Test design, statistical analysis, recommendations",
  },
  {
    id: "9",
    name: "UX Аудит",
    type: "audit", 
    category: "Продукт",
    description: "Комплексная оценка пользовательского опыта",
    author: "UX Team",
    tags: ["UX", "аудит", "usability"],
    capabilities: "Heuristic evaluation, user flow analysis, recommendations",
  },

  // Бизнес
  {
    id: "10",
    name: "Бизнес-план",
    type: "planning",
    category: "Бизнес",
    description: "Создание детального бизнес-плана", 
    author: "Business Consultant",
    tags: ["бизнес-план", "стратегия", "финмодель"],
    capabilities: "Market analysis, financial projections, risk assessment",
  },
  {
    id: "11",
    name: "Финансовая Модель",
    type: "modeling",
    category: "Бизнес",
    description: "Построение финансовой модели проекта",
    author: "Finance Expert",
    tags: ["финмодель", "прогнозы", "инвестиции"],
    capabilities: "DCF, unit economics, scenario modeling, valuation",
  },
  {
    id: "12",
    name: "Операционный Аудит", 
    type: "audit",
    category: "Бизнес",
    description: "Анализ и оптимизация бизнес-процессов",
    author: "Operations Consultant",
    tags: ["процессы", "оптимизация", "эффективность"],
    capabilities: "Process mapping, efficiency analysis, automation opportunities",
  },
  {
    id: "13",
    name: "Стратегическое Планирование",
    type: "planning",
    category: "Бизнес",
    description: "Разработка долгосрочной стратегии развития",
    author: "Strategy Consultant", 
    tags: ["стратегия", "планирование", "развитие"],
    capabilities: "SWOT analysis, strategic initiatives, OKR setting",
  },

  // HR
  {
    id: "14",
    name: "Подбор Персонала",
    type: "recruitment",
    category: "HR",
    description: "Полный цикл подбора сотрудников",
    author: "HR Consultant",
    tags: ["рекрутинг", "подбор", "интервью"], 
    capabilities: "Job descriptions, sourcing, interviewing, assessment",
  },
  {
    id: "15",
    name: "Оценка Персонала",
    type: "assessment",
    category: "HR", 
    description: "Комплексная оценка компетенций сотрудников",
    author: "HR Assessment",
    tags: ["оценка", "компетенции", "развитие"],
    capabilities: "360 feedback, competency assessment, development plans",
  },
  {
    id: "16",
    name: "Корпоративная Культура",
    type: "culture",
    category: "HR",
    description: "Диагностика и развитие корпоративной культуры",
    author: "Culture Expert",
    tags: ["культура", "ценности", "engagement"],
    capabilities: "Culture assessment, values definition, engagement programs",
  },

  // IT
  {
    id: "17",
    name: "IT Архитектура",
    type: "architecture", 
    category: "IT",
    description: "Проектирование IT архитектуры системы",
    author: "Solution Architect",
    tags: ["архитектура", "система", "дизайн"],
    capabilities: "System design, technology selection, scalability planning",
  },
  {
    id: "18",
    name: "Безопасность IT",
    type: "security",
    category: "IT",
    description: "Аудит и повышение информационной безопасности",
    author: "Security Expert", 
    tags: ["безопасность", "аудит", "защита"],
    capabilities: "Vulnerability assessment, security policies, compliance",
  },
  {
    id: "19",
    name: "Миграция Данных",
    type: "migration",
    category: "IT",
    description: "Планирование и выполнение миграции данных",
    author: "Data Engineer",
    tags: ["миграция", "данные", "ETL"],
    capabilities: "Data mapping, ETL processes, validation, rollback planning",
  },
  {
    id: "20",
    name: "Автоматизация Процессов",
    type: "automation", 
    category: "IT",
    description: "Автоматизация бизнес-процессов и workflow",
    author: "Automation Expert",
    tags: ["автоматизация", "workflow", "RPA"],
    capabilities: "Process automation, RPA, workflow design, integration",
  }
];

const typeColors = {
  analyst: "bg-blue-100 text-blue-800",
  creative: "bg-purple-100 text-purple-800", 
  technical: "bg-green-100 text-green-800",
  support: "bg-orange-100 text-orange-800",
  sales: "bg-red-100 text-red-800",
  hr: "bg-indigo-100 text-indigo-800",
  education: "bg-teal-100 text-teal-800",
  analysis: "bg-blue-100 text-blue-800",
  research: "bg-cyan-100 text-cyan-800",
  strategy: "bg-purple-100 text-purple-800",
  audit: "bg-gray-100 text-gray-800",
  campaign: "bg-pink-100 text-pink-800",
  planning: "bg-yellow-100 text-yellow-800",
  testing: "bg-green-100 text-green-800",
  modeling: "bg-indigo-100 text-indigo-800",
  recruitment: "bg-blue-100 text-blue-800",
  assessment: "bg-purple-100 text-purple-800",
  culture: "bg-pink-100 text-pink-800",
  architecture: "bg-gray-100 text-gray-800",
  security: "bg-red-100 text-red-800",
  migration: "bg-cyan-100 text-cyan-800",
  automation: "bg-green-100 text-green-800",
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

  const handleTryExample = (item: any) => {
    console.log("Trying example:", item);
  };

  const handleViewDetails = (item: any) => {
    console.log("Viewing details:", item);
  };

  // Группировка по категориям
  const groupByCategory = (items: any[]) => {
    return items.reduce((groups, item) => {
      const category = item.category || 'Другое';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  };

  const MarketplaceCard = ({ item, type }: { item: any; type: string }) => (
    <Card className="hover:shadow-lg transition-all duration-200 hover-scale">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <Badge className={typeColors[item.type as keyof typeof typeColors]}>
                {item.type}
              </Badge>
            </div>
            <CardDescription className="text-sm mb-2">{item.description}</CardDescription>
            {item.capabilities && (
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Что умеет:</strong> {item.capabilities}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs">{item.author[0]}</AvatarFallback>
              </Avatar>
              <span>by {item.author}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags?.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}>
            <Eye className="w-4 h-4 mr-1" />
            Подробнее
          </Button>
          <Button size="sm" onClick={() => handleTryExample(item)}>
            <Plus className="w-4 h-4 mr-1" />
            Попробовать
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const CategorySection = ({ categoryName, items, type }: { categoryName: string; items: any[]; type: string }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        {categoryName} ({items.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <MarketplaceCard key={item.id} item={item} type={type} />
        ))}
      </div>
    </div>
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
            <div className="space-y-8">
              {filteredAgents.length > 0 ? Object.entries(groupByCategory(filteredAgents)).map(([category, items]) => (
                <CategorySection 
                  key={category} 
                  categoryName={category} 
                  items={items} 
                  type="agent" 
                />
              )) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Агенты не найдены</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bots" className="mt-6">
            <div className="space-y-8">
              {filteredBots.length > 0 ? Object.entries(groupByCategory(filteredBots)).map(([category, items]) => (
                <CategorySection 
                  key={category} 
                  categoryName={category} 
                  items={items} 
                  type="bot" 
                />
              )) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Боты не найдены</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <div className="space-y-8">
              {filteredTasks.length > 0 ? Object.entries(groupByCategory(filteredTasks)).map(([category, items]) => (
                <CategorySection 
                  key={category} 
                  categoryName={category} 
                  items={items} 
                  type="task" 
                />
              )) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Задачи не найдены</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}