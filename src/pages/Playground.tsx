import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Send,
  Bot,
  User,
  Trash2,
  Play,
  Square,
  Brain,
  MessageSquare,
  Sparkles,
  Zap,
  Shield,
  Copy,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Edit3,
  MoreHorizontal,
  Download,
  Share,
  Settings,
  ChevronDown,
  Loader2,
  Circle,
  Maximize2,
  Search,
  Clock,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserAgents, type UserAgent } from "@/utils/agentStorage";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentId?: string;
}

interface ChatSession {
  id: string;
  agentId: string;
  agentName: string;
  messages: Message[];
  createdAt: Date;
}

const Playground = () => {
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<UserAgent | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load user agents
  useEffect(() => {
    const agents = getUserAgents();
    setUserAgents(agents);
    
    // Load chat sessions from localStorage
    const savedSessions = localStorage.getItem('chat-sessions');
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setChatSessions(sessions);
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      }
    }
  }, []);

  // Save chat sessions to localStorage
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('chat-sessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const startNewChat = (agent: UserAgent) => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.id,
      agentName: agent.name,
      messages: [],
      createdAt: new Date()
    };

    setSelectedAgent(agent);
    setCurrentSession(newSession);
    setChatSessions(prev => [newSession, ...prev]);
    
    toast({
      title: "Новый чат",
      description: `Начат чат с агентом "${agent.name}"`
    });
  };

  const continueChat = (session: ChatSession) => {
    const agent = userAgents.find(a => a.id === session.agentId);
    if (agent) {
      setSelectedAgent(agent);
      setCurrentSession(session);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || !selectedAgent || isGenerating) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      agentId: selectedAgent.id
    };

    // Update current session with user message
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage]
    };
    setCurrentSession(updatedSession);

    // Update sessions list
    setChatSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );

    setInputMessage("");
    setIsGenerating(true);
    setIsTyping(true);

    try {
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsTyping(false);
      
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1200));

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: generateMockResponse(inputMessage, selectedAgent),
        timestamp: new Date(),
        agentId: selectedAgent.id
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage]
      };

      setCurrentSession(finalSession);
      setChatSessions(prev => 
        prev.map(s => s.id === currentSession.id ? finalSession : s)
      );

    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось получить ответ от агента",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
    }
  };

  const generateMockResponse = (userInput: string, agent: UserAgent): string => {
    const responses = {
      analyst: [
        "Интересный вопрос! Давайте проанализируем данные. На основе предоставленной информации я вижу несколько ключевых трендов...",
        "Анализируя этот вопрос, важно рассмотреть различные метрики и KPI. Рекомендую обратить внимание на...",
        "Хороший аналитический запрос. Для получения точных выводов необходимо учесть следующие факторы..."
      ],
      creative: [
        "Отличная идея для творческого развития! Предлагаю несколько креативных подходов к решению этой задачи...",
        "Ваш запрос вдохновляет на создание чего-то уникального. Вот несколько креативных концепций...",
        "Интересный творческий вызов! Давайте подумаем нестандартно и создадим что-то особенное..."
      ],
      technical: [
        "С технической точки зрения этот вопрос требует системного подхода. Рассмотрим архитектуру решения...",
        "Хороший технический вопрос! Для реализации потребуется учесть следующие аспекты...",
        "Анализируя техническую сторону, рекомендую использовать современные подходы и лучшие практики..."
      ]
    };

    const agentResponses = responses[agent.type as keyof typeof responses] || responses.analyst;
    const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
    
    return `${randomResponse}\n\n*[Это демо-ответ. В реальном приложении здесь будет ответ от ${agent.aiProvider} ${agent.aiModel}]*`;
  };

  const clearChat = () => {
    if (currentSession) {
      const clearedSession = { ...currentSession, messages: [] };
      setCurrentSession(clearedSession);
      setChatSessions(prev => 
        prev.map(s => s.id === currentSession.id ? clearedSession : s)
      );
    }
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setSelectedAgent(null);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Скопировано",
      description: "Сообщение скопировано в буфер обмена"
    });
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'openai': return <Zap className="w-3 h-3" />;
      case 'anthropic': return <Shield className="w-3 h-3" />;
      case 'google': return <Brain className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredSessions = chatSessions.filter(session =>
    session.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportChat = () => {
    if (!currentSession) return;
    
    const chatText = currentSession.messages
      .map(msg => `${msg.role === 'user' ? 'Пользователь' : selectedAgent?.name}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${selectedAgent?.name}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Чат сохранен в файл"
    });
  };

  const suggestedPrompts = selectedAgent ? [
    `Расскажи о своих возможностях как ${selectedAgent.type} агент`,
    `Какие задачи ты можешь решать лучше всего?`,
    `Покажи пример своей работы`,
    `Какие у тебя есть ограничения?`
  ] : [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
        <div className="flex h-full gap-4">
          
          {/* Collapsible Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 space-y-4 flex flex-col`}>
            {/* Header with Collapse Button */}
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    Playground
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Общайтесь с вашими AI агентами
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="shrink-0"
              >
                {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </Button>
            </div>

            {/* Agent Selection */}
            {!sidebarCollapsed ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Выберите агента</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userAgents.length > 0 ? (
                    userAgents.map((agent) => (
                      <Button
                        key={agent.id}
                        variant={selectedAgent?.id === agent.id ? "default" : "ghost"}
                        className="w-full justify-start p-3 h-auto"
                        onClick={() => startNewChat(agent)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{agent.name}</span>
                              {agent.aiProvider && (
                                <div className="flex items-center gap-1">
                                  {getProviderIcon(agent.aiProvider)}
                                  <Badge variant="secondary" className="text-xs">
                                    {agent.aiModel}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {agent.description}
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Bot className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">Нет агентов</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Создайте своего первого AI агента
                      </p>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = '/my-agents'}>
                        Создать агента
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Collapsed sidebar - show only agent icons
              <div className="space-y-2">
                {userAgents.map((agent) => (
                  <Button
                    key={agent.id}
                    variant={selectedAgent?.id === agent.id ? "default" : "ghost"}
                    size="icon"
                    className="w-12 h-12"
                    onClick={() => startNewChat(agent)}
                    title={agent.name}
                  >
                    <Bot className="w-5 h-5" />
                  </Button>
                ))}
                {userAgents.length === 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12"
                    onClick={() => window.location.href = '/my-agents'}
                    title="Создать агента"
                  >
                    <Bot className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

            {/* Chat History */}
            {!sidebarCollapsed && (
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">История чатов</CardTitle>
                    {chatSessions.length > 0 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Search className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {chatSessions.length > 3 && (
                    <div className="relative mt-2">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск чатов..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    {filteredSessions.length > 0 ? (
                      <div className="space-y-2">
                        {filteredSessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:border-primary/50 group ${
                              currentSession?.id === session.id ? 'bg-muted border-primary shadow-sm' : ''
                            }`}
                            onClick={() => continueChat(session)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <p className="text-sm font-medium truncate">
                                    {session.agentName}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{session.messages.length} сообщений</span>
                                  <Clock className="w-3 h-3 ml-auto" />
                                  <span>{formatTime(session.createdAt)}</span>
                                </div>
                                {session.messages.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {session.messages[session.messages.length - 1].content}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {searchQuery ? 'Чаты не найдены' : 'История пуста'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {searchQuery ? 'Попробуйте другой запрос' : 'Начните новый чат с агентом'}
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentSession && selectedAgent ? (
              <>
                {/* Enhanced Chat Header */}
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{selectedAgent.name}</h3>
                            {selectedAgent.aiProvider && (
                              <div className="flex items-center gap-1">
                                {getProviderIcon(selectedAgent.aiProvider)}
                                <Badge variant="secondary" className="text-xs">
                                  {selectedAgent.aiModel}
                                </Badge>
                              </div>
                            )}
                            {isTyping && (
                              <Badge variant="outline" className="text-xs animate-pulse">
                                <Circle className="w-2 h-2 mr-1 fill-current" />
                                печатает...
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedAgent.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          title="Полноэкранный режим"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={exportChat}
                          disabled={currentSession.messages.length === 0}
                          title="Экспорт чата"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearChat}
                          disabled={currentSession.messages.length === 0}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Очистить
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Enhanced Messages Area */}
                <Card className="flex-1 flex flex-col">
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-4">
                      {currentSession.messages.length > 0 ? (
                        <div className="space-y-4">
                          {currentSession.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex group ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] ${
                                message.role === 'user' ? 'order-2' : 'order-1'
                              }`}>
                                <div className={`rounded-xl p-4 shadow-sm ${
                                  message.role === 'user' 
                                    ? 'bg-primary text-primary-foreground ml-4' 
                                    : 'bg-card border mr-4'
                                }`}>
                                  <div className="flex items-start gap-3">
                                    {message.role === 'assistant' ? (
                                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                        <Bot className="w-3 h-3" />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                                        <User className="w-3 h-3" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                        {message.content}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs opacity-60">
                                          {formatTime(message.timestamp)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => copyMessage(message.content)}
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Typing Indicator */}
                          {isGenerating && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%]">
                                <div className="bg-card border rounded-xl p-4 mr-4 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Bot className="w-3 h-3" />
                                    </div>
                                    <div className="flex gap-1">
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                    <span className="text-sm text-muted-foreground">AI генерирует ответ...</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center max-w-md">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold mb-2">Начните разговор</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Отправьте сообщение агенту "{selectedAgent.name}" чтобы начать общение
                            </p>
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Попробуйте спросить:</p>
                              <div className="space-y-1">
                                {suggestedPrompts.slice(0, 2).map((prompt, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-auto p-2 w-full"
                                    onClick={() => setInputMessage(prompt)}
                                  >
                                    {prompt}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Enhanced Input Area */}
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Напишите сообщение..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          className="min-h-[80px] resize-none"
                          disabled={isGenerating}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Enter для отправки</span>
                            <span>•</span>
                            <span>Shift+Enter для новой строки</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {inputMessage.length}/2000
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isGenerating}
                        className="self-end"
                        size="icon"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Добро пожаловать в Playground</h2>
                  <p className="text-muted-foreground mb-6">
                    Выберите AI агента из списка слева чтобы начать общение или создайте нового агента
                  </p>
                  
                  {userAgents.length === 0 ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg border-dashed border-2">
                        <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">
                          У вас пока нет агентов
                        </p>
                        <Button onClick={() => window.location.href = '/my-agents'}>
                          <Bot className="w-4 h-4 mr-2" />
                          Создать первого агента
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                        <div
                          key={index}
                          className="p-3 bg-muted/30 rounded-lg border text-left cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-sm">{prompt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Playground;