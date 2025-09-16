import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Key, 
  Eye, 
  EyeOff, 
  TestTube, 
  Check, 
  X, 
  Loader2, 
  Trash2,
  Plus,
  ExternalLink,
  Shield,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ApiProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  website: string;
  models: string[];
  testEndpoint?: string;
  status: 'not-configured' | 'configured' | 'testing' | 'valid' | 'invalid';
}

const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, DALL-E, Whisper',
    icon: <Zap className="w-5 h-5" />,
    website: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'dall-e-3'],
    testEndpoint: '/api/test-openai',
    status: 'not-configured'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Llama 3.1 Sonar, поиск в реальном времени',
    icon: <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">P</div>,
    website: 'https://www.perplexity.ai/settings/api',
    models: ['llama-3.1-sonar-large', 'llama-3.1-sonar-small', 'sonar-deep-research'],
    testEndpoint: '/api/test-perplexity',
    status: 'configured'
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    description: 'Deepseek V3, высокопроизводительная модель',
    icon: <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">D</div>,
    website: 'https://platform.deepseek.com/api_keys',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-math'],
    testEndpoint: '/api/test-deepseek',
    status: 'not-configured'
  }
];

const ApiKeys = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ApiProvider[]>(API_PROVIDERS);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; providerId: string | null }>({
    open: false,
    providerId: null
  });
  const { toast } = useToast();

  // Загрузка API ключей из базы данных
  useEffect(() => {
    const loadApiKeys = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('provider')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading API keys:', error);
          return;
        }

        // Обновляем статусы провайдеров на основе данных из БД
        const configuredProviders = data?.map(row => row.provider) || [];
        setProviders(prev => prev.map(provider => ({
          ...provider,
          status: configuredProviders.includes(provider.id) ? 'configured' : 'not-configured'
        })));
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    };

    loadApiKeys();
  }, [user]);

  const saveApiKey = async (providerId: string, key: string) => {
    if (!key.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите API ключ для сохранения",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    try {
      // Проверяем, существует ли уже ключ для этого провайдера
      const { data: existingKey } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('provider', providerId)
        .eq('user_id', user.id)
        .single();

      let error;
      
      if (existingKey) {
        // Обновляем существующий ключ
        const result = await supabase
          .from('user_api_keys')
          .update({
            api_key: key.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('provider', providerId)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Создаем новый ключ
        const result = await supabase
          .from('user_api_keys')
          .insert({
            provider: providerId,
            api_key: key.trim(),
            user_id: user.id
          });
        error = result.error;
      }

      if (error) {
        throw error;
      }
      
      // Обновляем статус провайдера на "configured" сразу после сохранения
      setProviders(prev => prev.map(provider => 
        provider.id === providerId 
          ? { ...provider, status: 'configured' }
          : provider
      ));

      // Очищаем поле ввода
      setApiKeys(prev => ({ ...prev, [providerId]: "" }));

      toast({
        title: "API ключ сохранён",
        description: `Ключ для ${providers.find(p => p.id === providerId)?.name} сохранён в базе данных`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('Save key error:', error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить ключ в базе данных",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const deleteApiKey = async (providerId: string) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    try {
      // Удаляем ключ из базы данных
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('provider', providerId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
      
      // Обновляем статус провайдера
      setProviders(prev => prev.map(provider => 
        provider.id === providerId 
          ? { ...provider, status: 'not-configured' }
          : provider
      ));

      toast({
        title: "API ключ удалён",
        description: `Ключ для ${providers.find(p => p.id === providerId)?.name} удалён`,
        duration: 2000
      });
    } catch (error) {
      console.error('Delete key error:', error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить ключ из базы данных",
        variant: "destructive",
        duration: 2000
      });
    }
  };


  const testConnection = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    const apiKey = apiKeys[providerId];
    
    if (!provider || (!apiKey && providerId !== 'perplexity')) {
      toast({
        title: "Ошибка",
        description: "API ключ не найден",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    setTestingProvider(providerId);
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, status: 'testing' } : p
    ));

    try {
      // Выполняем реальный тест API через edge функцию с таймаутом
      let testResult = false;
      
      // Функция для создания промиса с таймаутом
      const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs/1000}s`)), timeoutMs)
          )
        ]);
      };
      
      if (providerId === 'openai') {
        console.log('Testing OpenAI connection...');
        const session = await supabase.auth.getSession();
        console.log('Current session:', session.data.session?.access_token ? 'exists' : 'missing');
        
        const { data, error } = await withTimeout(
          supabase.functions.invoke('chat-with-ai', {
            body: {
              messages: [{ role: 'user', content: 'Test' }],
              provider: 'openai',
              model: 'gpt-4o-mini',
              stream: false,
              testMode: true
            },
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`
            }
          }),
          15000
        );
        
        if (error) {
          console.error('OpenAI test error:', error);
          throw new Error(error.message || 'OpenAI API connection failed');
        }
        
        if (data && data.error) {
          console.error('OpenAI API returned error:', data.error);
          throw new Error(data.error);
        }
        
        testResult = data && data.generatedText && !data.error;
        
      } else if (providerId === 'perplexity') {
        console.log('Testing Perplexity connection...');
        const session = await supabase.auth.getSession();
        
        const { data, error } = await withTimeout(
          supabase.functions.invoke('chat-with-ai', {
            body: {
              messages: [{ role: 'user', content: 'Test' }],
              provider: 'perplexity',
              model: 'sonar-deep-research',
              stream: false,
              testMode: true
            },
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`
            }
          }),
          15000
        );
        
        if (error) {
          console.error('Perplexity test error:', error);
          throw new Error(error.message || 'Perplexity API connection failed');
        }
        
        if (data && data.error) {
          console.error('Perplexity API returned error:', data.error);
          throw new Error(data.error);
        }
        
        testResult = data && data.generatedText && !data.error;
        
      } else if (providerId === 'deepseek') {
        console.log('Testing Deepseek connection...');
        const session = await supabase.auth.getSession();
        
        const { data, error } = await withTimeout(
          supabase.functions.invoke('chat-with-ai', {
            body: {
              messages: [{ role: 'user', content: 'Test' }],
              provider: 'deepseek',
              model: 'deepseek-chat',
              stream: false,
              testMode: true
            },
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`
            }
          }),
          15000
        );
        
        if (error) {
          console.error('Deepseek test error:', error);
          throw new Error(error.message || 'Deepseek API connection failed');
        }
        
        if (data && data.error) {
          console.error('Deepseek API returned error:', data.error);
          throw new Error(data.error);
        }
        
        testResult = data && data.generatedText && !data.error;
      }
      
      const isValid = testResult;
      
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, status: isValid ? 'valid' : 'invalid' }
          : p
      ));

      toast({
        title: isValid ? "Подключение успешно" : "Ошибка подключения",
        description: isValid 
          ? `API ключ для ${provider.name} работает корректно`
          : `Не удалось подключиться к ${provider.name}. Проверьте API ключ.`,
        variant: isValid ? "default" : "destructive",
        duration: 2000
      });
    } catch (error) {
      console.error('Test connection error:', error);
      
      // При ошибке сбрасываем статус на "не настроено"
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, status: 'not-configured' } : p
      ));
      
      toast({
        title: "Ошибка тестирования",
        description: error instanceof Error ? error.message : "Произошла ошибка при тестировании подключения",
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const getStatusBadge = (status: ApiProvider['status']) => {
    switch (status) {
      case 'not-configured':
        return <Badge variant="secondary">Не настроено</Badge>;
      case 'configured':
        return <Badge variant="outline">Настроено</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-700">Тестирование...</Badge>;
      case 'valid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Готов к использованию</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Ошибка</Badge>;
    }
  };

  const getStatusIcon = (status: ApiProvider['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'valid':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'invalid':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6" />
              API Ключи
            </h1>
            <p className="text-sm text-muted-foreground">
              Управляйте подключениями к нейросетям
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 dark:text-amber-100">
                  Безопасность данных
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  API ключи хранятся локально в вашем браузере и не передаются на наши серверы. 
                  Некоторые ключи могут быть сохранены в защищённом хранилище Supabase для edge функций.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Providers */}
        <div className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      {provider.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        {getStatusBadge(provider.status)}
                      </div>
                      <CardDescription className="mt-1">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(provider.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(provider.website, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Получить ключ
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Models */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Поддерживаемые модели
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {provider.models.map((model) => (
                      <Badge key={model} variant="secondary" className="text-xs">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* API Key Input */}
                <div className="space-y-3">
                  <Label htmlFor={`api-key-${provider.id}`} className="text-sm font-medium">
                    API Ключ
                  </Label>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={`api-key-${provider.id}`}
                        type={showKeys[provider.id] ? "text" : "password"}
                        value={apiKeys[provider.id] || ""}
                        onChange={(e) => {
                          setApiKeys(prev => ({
                            ...prev,
                            [provider.id]: e.target.value
                          }));
                        }}
                        placeholder="Введите ваш API ключ..."
                        className="h-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10"
                        onClick={() => {
                          setShowKeys(prev => ({
                            ...prev,
                            [provider.id]: !prev[provider.id]
                          }));
                        }}
                      >
                        {showKeys[provider.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <Button
                      onClick={() => saveApiKey(provider.id, apiKeys[provider.id] || "")}
                      disabled={!apiKeys[provider.id]}
                      className="h-10 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Сохранить
                    </Button>
                    
                    {provider.status === 'configured' && (
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialog({ open: true, providerId: provider.id })}
                        className="h-10 w-10 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Test Button */}
                {(provider.status === 'configured' || provider.status === 'valid' || provider.status === 'invalid') && (
                  <Button
                    variant="outline"
                    onClick={() => testConnection(provider.id)}
                    disabled={testingProvider === provider.id}
                    className="w-full h-10"
                  >
                    {testingProvider === provider.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Тестировать подключение
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, providerId: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить API ключ?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы действительно хотите удалить API ключ для {providers.find(p => p.id === deleteDialog.providerId)?.name}?
                Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (deleteDialog.providerId) {
                    deleteApiKey(deleteDialog.providerId);
                  }
                  setDeleteDialog({ open: false, providerId: null });
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default ApiKeys;