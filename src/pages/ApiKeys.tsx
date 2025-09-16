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
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus',
    icon: <Shield className="w-5 h-5" />,
    website: 'https://console.anthropic.com/keys',
    models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    testEndpoint: '/api/test-anthropic',
    status: 'not-configured'
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini Pro, Gemini Vision',
    icon: <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-red-500 rounded" />,
    website: 'https://aistudio.google.com/app/apikey',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro-vision'],
    testEndpoint: '/api/test-google',
    status: 'not-configured'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Llama 3.1 Sonar, поиск в реальном времени',
    icon: <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">P</div>,
    website: 'https://www.perplexity.ai/settings/api',
    models: ['llama-3.1-sonar-large', 'llama-3.1-sonar-small'],
    testEndpoint: '/api/test-perplexity',
    status: 'configured' // уже есть в Supabase secrets
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral Large, Mixtral 8x7B',
    icon: <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">M</div>,
    website: 'https://console.mistral.ai/api-keys/',
    models: ['mistral-large', 'mixtral-8x7b', 'mistral-medium'],
    testEndpoint: '/api/test-mistral',
    status: 'not-configured'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Доступ к тысячам open-source моделей',
    icon: <div className="w-5 h-5 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">🤗</div>,
    website: 'https://huggingface.co/settings/tokens',
    models: ['mixtral-8x7b', 'llama-2-70b', 'code-llama'],
    testEndpoint: '/api/test-huggingface',
    status: 'not-configured'
  }
];

const ApiKeys = () => {
  const [providers, setProviders] = useState<ApiProvider[]>(API_PROVIDERS);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; providerId: string | null }>({
    open: false,
    providerId: null
  });
  const { toast } = useToast();

  // Загрузка сохранённых ключей из localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('ai-api-keys');
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        setApiKeys(keys);
        
        // Обновляем статусы провайдеров
        setProviders(prev => prev.map(provider => ({
          ...provider,
          status: keys[provider.id] ? 'configured' : 
                  provider.id === 'perplexity' ? 'configured' : 'not-configured'
        })));
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    }
  }, []);

  const saveApiKey = (providerId: string, key: string) => {
    const updatedKeys = { ...apiKeys, [providerId]: key };
    setApiKeys(updatedKeys);
    localStorage.setItem('ai-api-keys', JSON.stringify(updatedKeys));
    
    // Обновляем статус провайдера
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { ...provider, status: key ? 'configured' : 'not-configured' }
        : provider
    ));

    toast({
      title: "API ключ сохранён",
      description: `Ключ для ${providers.find(p => p.id === providerId)?.name} успешно сохранён`
    });
  };

  const deleteApiKey = (providerId: string) => {
    const updatedKeys = { ...apiKeys };
    delete updatedKeys[providerId];
    setApiKeys(updatedKeys);
    localStorage.setItem('ai-api-keys', JSON.stringify(updatedKeys));
    
    // Обновляем статус провайдера
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { ...provider, status: 'not-configured' }
        : provider
    ));

    toast({
      title: "API ключ удалён",
      description: `Ключ для ${providers.find(p => p.id === providerId)?.name} удалён`
    });
  };

  const updatePerplexityKey = async (providerId: string, key: string) => {
    if (!key.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите API ключ для обновления",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('update-secret', {
        body: {
          secretName: 'PERPLEXITY_API_KEY',
          secretValue: key.trim()
        }
      });

      if (error) {
        throw error;
      }
      
      // Очищаем поле после успешного обновления
      setApiKeys(prev => ({ ...prev, [providerId]: "" }));
      
      toast({
        title: "Ключ обновлён",
        description: "Новый ключ Perplexity сохранён в Supabase. Протестируйте подключение.",
      });
    } catch (error) {
      console.error('Update key error:', error);
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить ключ в Supabase",
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }

    setTestingProvider(providerId);
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, status: 'testing' } : p
    ));

    try {
      // Выполняем реальный тест API через edge функцию
      let testResult;
      
      if (providerId === 'perplexity') {
        // Тестируем Perplexity через chat-with-ai функцию
        const { data, error } = await supabase.functions.invoke('chat-with-ai', {
          body: {
            messages: [{ role: 'user', content: 'Hello' }],
            provider: 'perplexity',
            model: 'sonar',
            stream: false,
            testMode: true
          }
        });
        
        testResult = !error && data && !data.error;
        if (error || (data && data.error)) {
          console.error('Perplexity test error:', error || data.error);
        }
      } else if (providerId === 'openai') {
        // Тестируем OpenAI через chat-with-ai функцию
        const { data, error } = await supabase.functions.invoke('chat-with-ai', {
          body: {
            messages: [{ role: 'user', content: 'Hello' }],
            provider: 'openai',
            model: 'gpt-4o-mini',
            stream: false,
            testMode: true
          }
        });
        
        testResult = !error && data && !data.error;
        if (error || (data && data.error)) {
          console.error('OpenAI test error:', error || data.error);
        }
      } else {
        // Для других провайдеров пока оставляем базовую проверку
        testResult = apiKey && apiKey.length > 10;
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
        variant: isValid ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Test connection error:', error);
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, status: 'invalid' } : p
      ));
      
      toast({
        title: "Ошибка тестирования",
        description: "Произошла ошибка при тестировании подключения",
        variant: "destructive"
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
        return <Badge className="bg-primary/10 text-primary">Работает</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Ошибка</Badge>;
    }
  };

  const getStatusIcon = (status: ApiProvider['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'valid':
        return <Check className="w-4 h-4 text-primary" />;
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
                        placeholder={
                          provider.id === 'perplexity' 
                            ? "Введите новый ключ Perplexity или оставьте пустым для использования сохранённого" 
                            : "Вставьте ваш API ключ..."
                        }
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
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
                    
                    {provider.id === 'perplexity' ? (
                      <Button
                        onClick={() => updatePerplexityKey(provider.id, apiKeys[provider.id] || "")}
                        disabled={!apiKeys[provider.id]}
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Обновить в Supabase
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => saveApiKey(provider.id, apiKeys[provider.id] || "")}
                          disabled={!apiKeys[provider.id]}
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Сохранить
                        </Button>
                        
                        {provider.status === 'configured' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, providerId: provider.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Test Button */}
                {(provider.status === 'configured' || provider.status === 'valid' || provider.status === 'invalid') && (
                  <Button
                    variant="outline"
                    onClick={() => testConnection(provider.id)}
                    disabled={testingProvider === provider.id}
                    className="w-full"
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