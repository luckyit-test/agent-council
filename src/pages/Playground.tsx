import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Timer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserAgents, type UserAgent } from "@/utils/agentStorage";
import { supabase } from "@/integrations/supabase/client";
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
  const [generationStartTime, setGenerationStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
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

  // Timer for generation progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && generationStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - generationStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, generationStartTime]);

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
    console.log('sendMessage called', { inputMessage, currentSession, selectedAgent, isGenerating });
    if (!inputMessage.trim() || !currentSession || !selectedAgent || isGenerating) {
      console.log('Early return conditions met:', { 
        inputEmpty: !inputMessage.trim(), 
        noSession: !currentSession, 
        noAgent: !selectedAgent, 
        isGenerating 
      });
      return;
    }

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
    setGenerationStartTime(new Date());
    setElapsedTime(0);
    setStreamingContent('');

    // Set estimated time based on model
    const isDeepResearch = selectedAgent.aiModel?.includes('deep-research');
    setEstimatedTime(isDeepResearch ? 300 : 30); // 5 min for deep research, 30s for others

    try {
      // Determine which AI provider to use - use agent's configured provider or OpenAI as default
      const aiProvider = selectedAgent.aiProvider || 'openai';
      const aiModel = selectedAgent.aiModel || (aiProvider === 'openai' ? 'gpt-4o-mini' : aiProvider === 'perplexity' ? 'sonar' : 'claude-3-sonnet');
      
      console.log('About to call AI with:', { aiProvider, aiModel, agentPrompt: selectedAgent.prompt });
      
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsTyping(false);
      
      console.log('Calling supabase function...');
      
      // Check if streaming should be used
      const useStreaming = aiProvider === 'perplexity' || aiProvider === 'openai';

      if (useStreaming) {
        // Streaming request
        const response = await fetch(`https://awpessgdfvtbdcqnecfs.supabase.co/functions/v1/chat-with-ai`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cGVzc2dkZnZ0YmRjcW5lY2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDQyOTMsImV4cCI6MjA3MzA4MDI5M30.G7L-4WkWNi9cZdAsx3E7Y6Z-erxFLpw0woS7Z5mxuHw`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cGVzc2dkZnZ0YmRjcW5lY2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDQyOTMsImV4cCI6MjA3MzA4MDI5M30.G7L-4WkWNi9cZdAsx3E7Y6Z-erxFLpw0woS7Z5mxuHw',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: inputMessage.trim() }
            ],
            provider: aiProvider,
            model: aiModel,
            agentPrompt: selectedAgent.prompt,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  break;
                }
                if (data.trim()) {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      fullContent += content;
                      setStreamingContent(fullContent);
                    }
                  } catch (e) {
                    // Ignore parse errors for partial data
                  }
                }
              }
            }
          }
        }

        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: fullContent,
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

      } else {
        // Non-streaming request (fallback)
        const { data, error } = await supabase.functions.invoke('chat-with-ai', {
          body: {
            messages: [
              { role: 'user', content: inputMessage.trim() }
            ],
            provider: aiProvider,
            model: aiModel,
            agentPrompt: selectedAgent.prompt,
            stream: false,
          },
        });

        console.log('Supabase function response:', { data, error });

        if (error) {
          throw new Error(error.message || 'Failed to get response from AI');
        }

        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.content,
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
      }

    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось получить ответ от агента",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
      setStreamingContent('');
      setEstimatedTime(null);
      setGenerationStartTime(null);
      setElapsedTime(0);
    }
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

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
            <MessageSquare className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-lg font-semibold shrink-0">Playground</h1>
            
            {/* Smart Agent Selector - занимает всё доступное место */}
            <div className="flex-1 min-w-0">
              <SmartAgentSelector
                agents={userAgents}
                selectedAgent={selectedAgent}
                onSelectAgent={(agent) => startNewChat(agent)}
              />
            </div>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Chat History - показываем всегда, но содержимое зависит от выбранного агента */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Clock className="w-4 h-4" />
                  История
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3">
                  {selectedAgent ? (
                    <>
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
                            Нет истории чатов с этим агентом
                          </div>
                        )}
                      </ScrollArea>
                    </>
                  ) : (
                    <>
                      <h4 className="font-medium mb-3">Вся история чатов</h4>
                      <ScrollArea className="h-60">
                        {chatSessions.length > 0 ? (
                          <div className="space-y-2">
                            {chatSessions.map(session => {
                              const agent = userAgents.find(a => a.id === session.agentId);
                              return (
                                <div
                                  key={session.id}
                                  className="p-3 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
                                  onClick={() => {
                                    if (agent) {
                                      setSelectedAgent(agent);
                                      setCurrentSession(session);
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">
                                      {agent?.name || 'Неизвестный агент'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(session.createdAt)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {session.messages.length} сообщений
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            История чатов пуста
                          </div>
                        )}
                      </ScrollArea>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Actions - показываем всегда, но некоторые действия доступны только с агентом */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Действия
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="space-y-1">
                  {selectedAgent && (
                    <>
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
                        disabled={!currentSession?.messages.length}
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
                        disabled={!currentSession?.messages.length}
                      >
                        <Copy className="w-4 h-4" />
                        Экспорт чата
                      </Button>
                    </>
                  )}
                  
                  {!selectedAgent && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Выберите агента для доступа к действиям
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
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
                          {message.role === 'user' ? (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
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
                
                {/* Streaming content */}
                {isGenerating && streamingContent && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg max-w-[70%]">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamingContent}
                        </ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Генерируется...</span>
                        <Timer className="w-3 h-3" />
                        <span>{formatElapsedTime(elapsedTime)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading state without streaming */}
                {isGenerating && !streamingContent && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        {getProviderIcon(selectedAgent.aiProvider)}
                        <span>
                          {selectedAgent.aiModel?.includes('deep-research') 
                            ? `Глубокое исследование...`
                            : `${selectedAgent.name} обрабатывает запрос...`
                          }
                        </span>
                        <Timer className="w-3 h-3" />
                        <span>{formatElapsedTime(elapsedTime)}</span>
                      </div>
                      
                      {estimatedTime && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Прогресс выполнения</span>
                            <span>{Math.min(100, Math.round((elapsedTime / estimatedTime) * 100))}%</span>
                          </div>
                          <div className="w-full bg-background rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Ожидаемое время: ~{Math.floor(estimatedTime / 60)}:{((estimatedTime % 60).toString().padStart(2, '0'))} мин
                          </div>
                        </div>
                      )}
                      
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
                {(() => {
                  console.log('Current state:', { selectedAgent: !!selectedAgent, currentSession: !!currentSession, isGenerating, inputMessage: inputMessage.length });
                  return null;
                })()}
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