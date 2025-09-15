import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Key, Bell, Shield, Palette, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [settings, setSettings] = useState({
    // Profile
    displayName: "Пользователь",
    email: "user@example.com",
    bio: "",
    
    // API Keys
    openaiKey: "",
    anthropicKey: "",
    
    // Notifications
    emailNotifications: true,
    taskUpdates: true,
    agentAlerts: false,
    
    // Security
    twoFactorEnabled: false,
    sessionTimeout: "24",
    
    // Appearance
    theme: "dark",
    language: "ru"
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Настройки сохранены",
      description: "Ваши настройки успешно обновлены"
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Настройки</h1>
          <p className="text-muted-foreground">
            Управляйте своим аккаунтом и настройками платформы
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <CardTitle>Профиль</CardTitle>
                </div>
                <CardDescription>
                  Основная информация о вашем аккаунте
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">Отображаемое имя</Label>
                    <Input
                      id="displayName"
                      value={settings.displayName}
                      onChange={(e) => updateSetting("displayName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting("email", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">О себе</Label>
                  <Textarea
                    id="bio"
                    placeholder="Расскажите немного о себе..."
                    value={settings.bio}
                    onChange={(e) => updateSetting("bio", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* API Keys */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  <CardTitle>API Ключи</CardTitle>
                </div>
                <CardDescription>
                  Настройте подключения к AI провайдерам
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="openaiKey">OpenAI API Key</Label>
                  <Input
                    id="openaiKey"
                    type="password"
                    placeholder="sk-..."
                    value={settings.openaiKey}
                    onChange={(e) => updateSetting("openaiKey", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Для работы с GPT моделями
                  </p>
                </div>
                <div>
                  <Label htmlFor="anthropicKey">Anthropic API Key</Label>
                  <Input
                    id="anthropicKey"
                    type="password"
                    placeholder="sk-ant-..."
                    value={settings.anthropicKey}
                    onChange={(e) => updateSetting("anthropicKey", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Для работы с Claude моделями
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <CardTitle>Уведомления</CardTitle>
                </div>
                <CardDescription>
                  Настройте, какие уведомления вы хотите получать
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email уведомления</Label>
                    <p className="text-sm text-muted-foreground">
                      Получать уведомления на почту
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Обновления задач</Label>
                    <p className="text-sm text-muted-foreground">
                      Уведомления о завершении задач
                    </p>
                  </div>
                  <Switch
                    checked={settings.taskUpdates}
                    onCheckedChange={(checked) => updateSetting("taskUpdates", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Оповещения агентов</Label>
                    <p className="text-sm text-muted-foreground">
                      Уведомления от AI агентов
                    </p>
                  </div>
                  <Switch
                    checked={settings.agentAlerts}
                    onCheckedChange={(checked) => updateSetting("agentAlerts", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <CardTitle>Безопасность</CardTitle>
                </div>
                <CardDescription>
                  Настройки безопасности вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Двухфакторная аутентификация</Label>
                    <p className="text-sm text-muted-foreground">
                      Дополнительная защита аккаунта
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) => updateSetting("twoFactorEnabled", checked)}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="sessionTimeout">Время сессии (часы)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting("sessionTimeout", e.target.value)}
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статус аккаунта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">План</span>
                  <Badge className="bg-gradient-ai border-0">Pro</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Агентов</span>
                  <span className="text-sm font-medium">6 / ∞</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Задач в месяц</span>
                  <span className="text-sm font-medium">45 / 1000</span>
                </div>
                <Separator />
                <Button variant="outline" className="w-full">
                  Управление планом
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  Сгенерировать API ключ
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Экспорт данных
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  Удалить аккаунт
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-gradient-ai border-0">
            <Save className="w-4 h-4 mr-2" />
            Сохранить настройки
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;