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
                      className={cn(
                        "flex gap-4 group relative animate-fade-in",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {/* Message Container */}
                      <div className={cn(
                        "relative max-w-[80%] rounded-2xl p-5 shadow-sm border backdrop-blur-sm transition-all duration-300 hover:shadow-md",
                        message.role === 'user' 
                          ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-foreground" 
                          : "bg-gradient-to-br from-card to-card/80 border-border/50"
                      )}>
                        
                        {/* Avatar and Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                            message.role === 'user' 
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
                              : "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground"
                          )}>
                            {message.role === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {message.role === 'user' ? 'Вы' : selectedAgent?.name || 'AI Assistant'}
                              </span>
                              <span className="text-xs text-muted-foreground/70">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                            
                            {message.role === 'assistant' && selectedAgent && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-xs gap-1.5 bg-background/50 backdrop-blur-sm">
                                  {getProviderIcon(selectedAgent.aiProvider)}
                                  {selectedAgent.aiModel || selectedAgent.aiProvider || 'AI'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Message Content */}
                        <div className="prose prose-sm max-w-none">
                          {message.role === 'user' ? (
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap mb-0">
                              {message.content}
                            </p>
                          ) : (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: ({ node, inline, className, children, ...props }: any) => {
                                  if (inline) {
                                    return (
                                      <code className="px-2 py-1 rounded-md bg-muted/80 text-sm font-mono text-foreground border border-border/50" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <div className="my-4">
                                      <pre className="bg-gradient-to-br from-muted to-muted/80 p-4 rounded-xl overflow-x-auto border border-border/50 shadow-sm">
                                        <code className="text-sm font-mono text-foreground leading-relaxed" {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    </div>
                                  );
                                },
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-primary/5 rounded-r-lg italic text-muted-foreground">
                                    {children}
                                  </blockquote>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3 mt-6 first:mt-0">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3 mt-5 first:mt-0">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-medium text-foreground mb-2 mt-4 first:mt-0">
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="text-foreground leading-relaxed mb-3 last:mb-0">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-none space-y-2 text-foreground my-3">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside space-y-2 text-foreground my-3">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-foreground flex items-start gap-2">
                                    <Circle className="w-1.5 h-1.5 mt-2 shrink-0 fill-primary text-primary" />
                                    <span className="flex-1">{children}</span>
                                  </li>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-4">
                                    <table className="min-w-full border border-border/50 rounded-lg shadow-sm overflow-hidden">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                th: ({ children }) => (
                                  <th className="border-r border-border/50 px-4 py-3 bg-gradient-to-r from-muted to-muted/80 font-semibold text-left text-foreground">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="border-r border-border/50 border-t border-border/30 px-4 py-3 text-foreground">
                                    {children}
                                  </td>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-foreground">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic text-muted-foreground">
                                    {children}
                                  </em>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>

                        {/* Action Buttons - показываем только для сообщений ассистента при ховере */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyMessage(message.content)}
                              className="h-8 px-3 text-xs bg-background/50 hover:bg-background border border-border/50"
                            >
                              <Copy className="w-3 h-3 mr-1.5" />
                              Копировать
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {/* Streaming content - красивый стриминг */}
                {isGenerating && streamingContent && (
                  <div className="flex gap-4 justify-start animate-fade-in">
                    <div className="relative max-w-[80%] rounded-2xl p-5 shadow-md border backdrop-blur-sm bg-gradient-to-br from-card to-card/80 border-border/50">
                      
                      {/* Streaming Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground relative">
                          <Bot className="w-4 h-4" />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {selectedAgent?.name || 'AI Assistant'}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                              <span className="text-xs text-primary font-medium ml-1">Генерирую...</span>
                            </div>
                          </div>
                          
                          {selectedAgent && (
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs gap-1.5 bg-background/50 backdrop-blur-sm border-primary/30">
                                {getProviderIcon(selectedAgent.aiProvider)}
                                {selectedAgent.aiModel || selectedAgent.aiProvider || 'AI'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Streaming Content */}
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: ({ node, inline, className, children, ...props }: any) => {
                              if (inline) {
                                return (
                                  <code className="px-2 py-1 rounded-md bg-muted/80 text-sm font-mono text-foreground border border-border/50" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <div className="my-4">
                                  <pre className="bg-gradient-to-br from-muted to-muted/80 p-4 rounded-xl overflow-x-auto border border-border/50 shadow-sm">
                                    <code className="text-sm font-mono text-foreground leading-relaxed" {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                </div>
                              );
                            },
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-primary/5 rounded-r-lg italic text-muted-foreground">
                                {children}
                              </blockquote>
                            ),
                            h1: ({ children }) => (
                              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3 mt-6 first:mt-0">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3 mt-5 first:mt-0">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-base font-medium text-foreground mb-2 mt-4 first:mt-0">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-foreground leading-relaxed mb-3 last:mb-0">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-none space-y-2 text-foreground my-3">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside space-y-2 text-foreground my-3">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-foreground flex items-start gap-2">
                                <Circle className="w-1.5 h-1.5 mt-2 shrink-0 fill-primary text-primary" />
                                <span className="flex-1">{children}</span>
                              </li>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4">
                                <table className="min-w-full border border-border/50 rounded-lg shadow-sm overflow-hidden">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="border-r border-border/50 px-4 py-3 bg-gradient-to-r from-muted to-muted/80 font-semibold text-left text-foreground">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border-r border-border/50 border-t border-border/30 px-4 py-3 text-foreground">
                                {children}
                              </td>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-muted-foreground">
                                {children}
                              </em>
                            ),
                          }}
                        >
                          {streamingContent}
                        </ReactMarkdown>
                        
                        {/* Анимированный курсор */}
                        <span className="inline-flex items-center">
                          <span className="w-2 h-5 bg-gradient-to-t from-primary to-primary/70 animate-pulse ml-1 rounded-sm shadow-sm" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading state without streaming - улучшенная анимация */}
                {isGenerating && !streamingContent && (
                  <div className="flex gap-4 justify-start animate-fade-in">
                    <div className="relative max-w-[80%] rounded-2xl p-5 shadow-md border backdrop-blur-sm bg-gradient-to-br from-card to-card/80 border-border/50">
                      
                      {/* Loading Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground relative">
                          <Bot className="w-4 h-4" />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-transparent animate-pulse" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {selectedAgent?.name || 'AI Assistant'}
                            </span>
                            <div className="flex items-center gap-1">
                              {getProviderIcon(selectedAgent?.aiProvider)}
                              <span className="text-xs text-primary font-medium">
                                {selectedAgent?.aiModel?.includes('deep-research') 
                                  ? 'Глубокое исследование...'
                                  : 'Обрабатывает запрос...'
                                }
                              </span>
                            </div>
                          </div>
                          
                          {selectedAgent && (
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs gap-1.5 bg-background/50 backdrop-blur-sm border-primary/30">
                                {getProviderIcon(selectedAgent.aiProvider)}
                                {selectedAgent.aiModel || selectedAgent.aiProvider || 'AI'}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                                <Timer className="w-3 h-3" />
                                <span>{formatElapsedTime(elapsedTime)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar для Deep Research */}
                      {estimatedTime && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>Прогресс выполнения</span>
                            <span>{Math.min(100, Math.round((elapsedTime / estimatedTime) * 100))}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500 ease-out relative"
                              style={{ width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Ожидаемое время: ~{Math.floor(estimatedTime / 60)}:{((estimatedTime % 60).toString().padStart(2, '0'))} мин
                          </div>
                        </div>
                      )}
                      
                      {/* Анимированные точки */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Думаю</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
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