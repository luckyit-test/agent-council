import { Layout } from "@/components/Layout";

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
          <div className="flex justify-center gap-4">
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
        </div>

        {/* Quick Start */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Быстрый старт</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <h3 className="font-semibold mb-2">1. Создайте агента</h3>
              <p className="text-sm text-muted-foreground">
                Настройте собственного AI-агента с уникальным промптом
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <h3 className="font-semibold mb-2">2. Создайте задачу</h3>
              <p className="text-sm text-muted-foreground">
                Опишите задачу и выберите агентов для её решения
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <h3 className="font-semibold mb-2">3. Наблюдайте</h3>
              <p className="text-sm text-muted-foreground">
                Следите за процессом решения и вмешивайтесь при необходимости
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;