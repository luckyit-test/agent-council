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

    // Check if this is Deep Research model and add warning
    const isDeepResearch = selectedAgent.aiModel?.includes('deep-research');
    let messagesWithWarning = [userMessage];
    
    if (isDeepResearch) {
      const warningMessage: Message = {
        id: `msg_${Date.now()}_warning`,
        role: 'assistant',
        content: '🔍 **Deep Research начато** - это займет 3-8 минут для полного анализа...',
        timestamp: new Date(),
        agentId: selectedAgent.id
      };
      messagesWithWarning.push(warningMessage);
    }

    // Update current session with user message and warning if needed
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, ...messagesWithWarning]
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
      const useStreaming = aiProvider === 'perplexity' || (aiProvider === 'openai' && !aiModel?.startsWith('gpt-5'));

      if (useStreaming) {
        // Get current session for authorization
        const session = await supabase.auth.getSession();
        if (!session.data.session?.access_token) {
          throw new Error('User not authenticated');
        }

        console.log('Auth token for request:', session.data.session.access_token.substring(0, 50) + '...');

        // Streaming request
        const response = await fetch(`https://awpessgdfvtbdcqnecfs.supabase.co/functions/v1/chat-with-ai`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cGVzc2dkZnZ0YmRjcW5lY2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDQyOTMsImV4cCI6MjA3MzA4MDI5M30.G7L-4WkWNi9cZdAsx3E7Y6Z-erxFLpw0woS7Z5mxuHw',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              // Add all previous messages from the session
              ...currentSession.messages
                .filter(msg => msg.content && typeof msg.content === 'string' && !msg.content.includes('Deep Research начато'))
                .map(msg => ({
                  role: msg.role,
                  content: msg.content
                })),
              // Add current user message
              { role: 'user', content: inputMessage.trim() }
            ],
            provider: aiProvider,
            model: aiModel,
            agentPrompt: selectedAgent.prompt,
            capabilities: selectedAgent.capabilities,
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
                    
                    // Handle different response formats
                    let content = '';
                    
                    // Check if this is a complete message response (Perplexity format)
                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content) {
                      // Complete response - replace all content
                      fullContent = parsed.choices[0].message.content;
                      setStreamingContent(fullContent);
                    } 
                    // Check if this is streaming delta format (OpenAI format)
                    else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                      // Streaming delta - append content
                      content = parsed.choices[0].delta.content;
                      fullContent += content;
                      setStreamingContent(fullContent);
                    }
                  } catch (e) {
                    console.error('Error parsing streaming data:', e);
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

        let finalSession;
        if (isDeepResearch) {
          // Replace the warning message with the actual response
          finalSession = {
            ...updatedSession,
            messages: updatedSession.messages.map(msg => 
              msg.content?.includes('Deep Research начато') ? assistantMessage : msg
            )
          };
        } else {
          finalSession = {
            ...updatedSession,
            messages: [...updatedSession.messages, assistantMessage]
          };
        }

        setCurrentSession(finalSession);
        setChatSessions(prev => 
          prev.map(s => s.id === currentSession.id ? finalSession : s)
        );

      } else {
        // Non-streaming request using direct fetch
        const session = await supabase.auth.getSession();
        if (!session.data.session?.access_token) {
          throw new Error('User not authenticated');
        }

        const response = await fetch(`https://awpessgdfvtbdcqnecfs.supabase.co/functions/v1/chat-with-ai`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cGVzc2dkZnZ0YmRjcW5lY2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDQyOTMsImV4cCI6MjA3MzA4MDI5M30.G7L-4WkWNi9cZdAsx3E7Y6Z-erxFLpw0woS7Z5mxuHw',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              // Add all previous messages from the session
              ...currentSession.messages
                .filter(msg => msg.content && typeof msg.content === 'string' && !msg.content.includes('Deep Research начато'))
                .map(msg => ({
                  role: msg.role,
                  content: msg.content
                })),
              // Add current user message
              { role: 'user', content: inputMessage.trim() }
            ],
            provider: aiProvider,
            model: aiModel,
            agentPrompt: selectedAgent.prompt,
            capabilities: selectedAgent.capabilities,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Direct fetch response:', data);

        if (!data.generatedText) {
          throw new Error('No response generated by AI');
        }

        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.generatedText,
          timestamp: new Date(),
          agentId: selectedAgent.id
        };

        let finalSession;
        if (isDeepResearch) {
          // Replace the warning message with the actual response
          finalSession = {
            ...updatedSession,
            messages: updatedSession.messages.map(msg => 
              msg.content?.includes('Deep Research начато') ? assistantMessage : msg
            )
          };
        } else {
          finalSession = {
            ...updatedSession,
            messages: [...updatedSession.messages, assistantMessage]
          };
        }

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
        
        {/* Premium Header with Glassmorphism */}
        <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-border/50 backdrop-blur-sm shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6 min-w-0 flex-1 mr-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary text-primary-foreground shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    AI Playground
                  </h1>
                  <p className="text-sm text-muted-foreground">Интеллектуальное взаимодействие с агентами</p>
                </div>
              </div>
              
              {/* Enhanced Agent Selector */}
              <div className="flex-1 min-w-0 max-w-md">
                <SmartAgentSelector
                  agents={userAgents}
                  selectedAgent={selectedAgent}
                  onSelectAgent={(agent) => startNewChat(agent)}
                />
              </div>
            </div>
          
            {/* Premium Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Chat History with Glassmorphism */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-background/80 backdrop-blur-sm border-border/60 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    <Clock className="w-4 h-4" />
                    История
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-background/95 backdrop-blur-md border-border/60" align="end">
                  <div className="p-4">
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

              {currentSession && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearChat}
                  className="gap-2 bg-background/80 backdrop-blur-sm border-border/60 hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <Trash2 className="w-4 h-4" />
                  Очистить
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area with Enhanced Design */}
        <div className="flex-1 flex gap-8 min-h-0">
          
          {/* Enhanced Agent Selection Panel */}
          {!selectedAgent && (
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-full max-w-lg border-border/60 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 w-fit">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Выберите AI агента
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Выберите специализированного агента для начала интеллектуального диалога
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3" />
                    <span>Каждый агент обучен для конкретных задач</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Chat Interface */}
          {selectedAgent && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Premium Agent Info Header */}
              <div className="mb-6 p-6 bg-gradient-to-r from-card/90 to-card/60 rounded-2xl border border-border/60 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {selectedAgent.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          {selectedAgent.type}
                        </Badge>
                        {selectedAgent.aiProvider && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50">
                            {getProviderIcon(selectedAgent.aiProvider)}
                            <span className="text-xs font-medium">{selectedAgent.aiProvider}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{selectedAgent.aiModel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Generation Status */}
                  {isGenerating && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                      {isTyping ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm font-medium text-primary">Обдумывает...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Генерирует ответ</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Timer className="w-3 h-3" />
                            <span>{formatElapsedTime(elapsedTime)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Messages Area */}
              <ScrollArea className="flex-1 border border-border/60 rounded-2xl p-6 mb-6 bg-gradient-to-b from-background/50 to-background/30 backdrop-blur-sm">
                <div className="space-y-6">
                  {currentSession?.messages.map((message, index) => (
                    <div 
                      key={message.id} 
                      className={cn(
                        "flex gap-4 group animate-fade-in",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[75%] rounded-2xl p-4 relative shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto' 
                          : 'bg-gradient-to-br from-card/90 to-card/60 border border-border/50'
                      )}>
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 w-8 p-0 hover:bg-primary/10 hover:scale-110"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        
                        <div className={cn(
                          "text-xs mt-3 opacity-70 font-medium",
                          message.role === 'user' ? 'text-right' : 'text-left'
                        )}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                          <User className="w-5 h-5 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Enhanced Streaming content */}
                  {isGenerating && streamingContent && (
                    <div className="flex gap-4 justify-start animate-fade-in">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                        <Bot className="w-5 h-5 text-primary animate-pulse" />
                      </div>
                      <div className="max-w-[75%] rounded-2xl p-4 bg-gradient-to-br from-card/90 to-card/60 border border-border/50 shadow-lg backdrop-blur-sm">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {streamingContent}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <span>Печатает...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Enhanced Suggested Prompts */}
              {currentSession?.messages.length === 0 && !isGenerating && (
                <div className="mb-6 p-6 bg-gradient-to-r from-muted/30 to-muted/10 rounded-2xl border border-dashed border-border/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Начните с этих идей:</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        onClick={() => setInputMessage(prompt)}
                        className="h-auto p-4 text-left justify-start hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all duration-300 hover:shadow-md hover:scale-[1.02] rounded-xl bg-background/50"
                      >
                        <div className="text-sm leading-relaxed">{prompt}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Premium Input Area */}
              <div className="relative">
                <div className="flex gap-4 p-4 bg-gradient-to-r from-card/90 to-card/60 rounded-2xl border border-border/60 backdrop-blur-sm shadow-lg">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isGenerating 
                        ? "Агент готовит ответ..." 
                        : `Спросите что-нибудь у ${selectedAgent.name}...`
                    }
                    disabled={isGenerating}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 border-border/60 bg-background/80 backdrop-blur-sm focus:bg-background focus:ring-primary/20 focus:border-primary/30 transition-all duration-300 rounded-xl"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!inputMessage.trim() || isGenerating}
                    size="icon"
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Ambient glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-xl opacity-30 -z-10" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Playground;