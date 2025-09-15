import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { MessageSquare, Brain, Bot, Key } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">
            Добро пожаловать в AI Agents Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Платформа для совместной работы настраиваемых AI-агентов
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <div className="px-6 py-3 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">6</div>
              <div className="text-sm text-muted-foreground">Агентов</div>
            </div>
            <div className="px-6 py-3 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">3</div>
              <div className="text-sm text-muted-foreground">Активных задач</div>
            </div>
            <div className="px-6 py-3 bg-status-complete/10 rounded-lg">
              <div className="text-2xl font-bold text-status-complete">12</div>
              <div className="text-sm text-muted-foreground">Выполнено</div>
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button onClick={() => window.location.href = '/playground'} size="lg">
              <MessageSquare className="w-5 h-5 mr-2" />
              Открыть Playground
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/my-agents'} size="lg">
              <Brain className="w-5 h-5 mr-2" />
              Мои агенты
            </Button>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Быстрый старт</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" 
                 onClick={() => window.location.href = '/playground'}>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                1. Общение с агентами
              </h3>
              <p className="text-sm text-muted-foreground">
                Протестируйте своих агентов в Playground
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                 onClick={() => window.location.href = '/my-agents'}>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                2. Управление агентами
              </h3>
              <p className="text-sm text-muted-foreground">
                Создавайте и настраивайте своих AI-агентов
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                 onClick={() => window.location.href = '/api-keys'}>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                3. Настройка API
              </h3>
              <p className="text-sm text-muted-foreground">
                Подключите нейросети через API ключи
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;