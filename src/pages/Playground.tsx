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
  RotateCcw
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

    try {
      // Simulate AI response (в реальном приложении здесь будет вызов API)
      await new Promise(resolve => setTimeout(resolve, 1500));

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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
        <div className="flex h-full gap-6">
          
          {/* Sidebar */}
          <div className="w-80 space-y-4 flex flex-col">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Playground
              </h1>
              <p className="text-sm text-muted-foreground">
                Общайтесь с вашими AI агентами
              </p>
            </div>

            {/* Agent Selection */}
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
                    <p className="text-sm text-muted-foreground mb-2">
                      Нет доступных агентов
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/my-agents'}>
                      Создать агента
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat History */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">История чатов</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  {chatSessions.length > 0 ? (
                    <div className="space-y-2">
                      {chatSessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-2 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                            currentSession?.id === session.id ? 'bg-muted border-primary' : ''
                          }`}
                          onClick={() => continueChat(session)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {session.agentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {session.messages.length} сообщений
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
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
                    <p className="text-sm text-muted-foreground text-center">
                      История чатов пуста
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentSession && selectedAgent ? (
              <>
                {/* Chat Header */}
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
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
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedAgent.description}
                          </p>
                        </div>
                      </div>
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
                  </CardHeader>
                </Card>

                {/* Messages */}
                <Card className="flex-1 flex flex-col">
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-4">
                      {currentSession.messages.length > 0 ? (
                        <div className="space-y-4">
                          {currentSession.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] ${
                                message.role === 'user' ? 'order-2' : 'order-1'
                              }`}>
                                <div className={`rounded-lg p-3 ${
                                  message.role === 'user' 
                                    ? 'bg-primary text-primary-foreground ml-4' 
                                    : 'bg-muted mr-4'
                                }`}>
                                  <div className="flex items-start gap-2 mb-2">
                                    {message.role === 'assistant' ? (
                                      <Bot className="w-4 h-4 mt-1 shrink-0" />
                                    ) : (
                                      <User className="w-4 h-4 mt-1 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                                      onClick={() => copyMessage(message.content)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <p className="text-xs opacity-70">
                                    {formatTime(message.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {isGenerating && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%]">
                                <div className="bg-muted rounded-lg p-3 mr-4">
                                  <div className="flex items-center gap-2">
                                    <Bot className="w-4 h-4" />
                                    <div className="flex gap-1">
                                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Начните беседу</h3>
                            <p className="text-muted-foreground">
                              Задайте вопрос агенту "{selectedAgent.name}"
                            </p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </ScrollArea>
                  </CardContent>

                  {/* Input Area */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Напишите сообщение..."
                        className="resize-none"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isGenerating}
                        size="icon"
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              /* No Agent Selected */
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Выберите агента</h3>
                  <p className="text-muted-foreground mb-4">
                    Выберите агента из списка слева, чтобы начать общение
                  </p>
                  {userAgents.length === 0 && (
                    <Button variant="outline" onClick={() => window.location.href = '/my-agents'}>
                      Создать первого агента
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Playground;