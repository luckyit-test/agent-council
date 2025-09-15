import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Bot,
  User,
  Trash2,
  Brain,
  MessageSquare,
  Sparkles,
  Zap,
  Shield,
  Copy,
  Loader2,
  Circle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserAgents, type UserAgent } from "@/utils/agentStorage";
import { SmartAgentSelector } from "@/components/SmartAgentSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

  const suggestedPrompts = selectedAgent ? [
    `Расскажи о своих возможностях как ${selectedAgent.type} агент`,
    `Какие задачи ты можешь решать лучше всего?`,
    `Покажи пример своей работы`,
    `Какие у тебя есть ограничения?`
  ] : [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col">
        
        {/* Compact Header with Smart Agent Selector */}
        <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-4 flex-1">
            <MessageSquare className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-lg font-semibold shrink-0">Playground</h1>
            
            {/* Smart Agent Selector */}
            <div className="flex-1 max-w-md">
              <SmartAgentSelector
                agents={userAgents}
                selectedAgent={selectedAgent}
                onSelectAgent={(agent) => startNewChat(agent)}
              />
            </div>
          </div>
          
          {/* Right Actions */}
          {selectedAgent && (
            <div className="flex items-center gap-2">
              {/* Chat History */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Clock className="w-4 h-4" />
                    История
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-3">
                    <h4 className="font-medium mb-3">История чатов с {selectedAgent.name}</h4>
                    <ScrollArea className="h-60">
                      {chatSessions.filter(s => s.agentId === selectedAgent.id).length > 0 ? (
                        <div className="space-y-2">
                          {chatSessions
                            .filter(s => s.agentId === selectedAgent.id)
                            .map(session => (
                              <div
                                key={session.id}
                                className={cn(
                                  "p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors",
                                  currentSession?.id === session.id && "bg-muted border-primary"
                                )}
                                onClick={() => setCurrentSession(session)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">
                                    {session.messages.length} сообщений
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(session.createdAt)}
                                  </span>
                                </div>
                                {session.messages.length > 0 && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {session.messages[0].content}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Нет истории чатов
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Quick Actions */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Действия
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start gap-2"
                      onClick={() => startNewChat(selectedAgent)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Новый чат
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start gap-2"
                      onClick={clearChat}
                    >
                      <Trash2 className="w-4 h-4" />
                      Очистить чат
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        if (currentSession?.messages.length) {
                          const chatContent = currentSession.messages
                            .map(m => `${m.role === 'user' ? 'Пользователь' : selectedAgent.name}: ${m.content}`)
                            .join('\n\n');
                          navigator.clipboard.writeText(chatContent);
                          toast({
                            title: "Экспорт чата",
                            description: "Переписка скопирована в буфер обмена"
                          });
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                      Экспорт чата
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        {selectedAgent && currentSession ? (
          <div className="flex flex-col flex-1 min-h-0">
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-card rounded-t-lg">
              <div className="space-y-4">
                {currentSession.messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Начните разговор</h3>
                    <p className="text-muted-foreground mb-6">
                      Задайте вопрос агенту {selectedAgent.name}
                    </p>
                    
                    {/* Suggested Prompts */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Попробуйте спросить:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                        {suggestedPrompts.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-left h-auto p-3"
                            onClick={() => setInputMessage(prompt)}
                          >
                            <span className="text-xs">{prompt}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  currentSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className={`max-w-[70%] ${message.role === 'user' ? 'order-2' : ''}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>{formatTime(message.timestamp)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        {getProviderIcon(selectedAgent.aiProvider)}
                        <span>{selectedAgent.name} печатает...</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-card rounded-b-lg">
              <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Сообщение для ${selectedAgent.name}...`}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  disabled={isGenerating}
                  className="flex-1 min-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={4}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isGenerating}
                  size="icon"
                  className="self-end"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Добро пожаловать в Playground</h3>
              <p className="text-muted-foreground mb-4">
                Выберите агента из списка выше, чтобы начать общение
              </p>
              {userAgents.length === 0 && (
                <Button onClick={() => window.location.href = '/my-agents'}>
                  Создать первого агента
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Playground;