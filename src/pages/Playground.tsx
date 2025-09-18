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
  Timer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserAgents, type UserAgent } from "@/utils/agentStorage";
import { supabase } from "@/integrations/supabase/client";
import { SmartAgentSelector } from "@/components/SmartAgentSelector";
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
    if (!inputMessage.trim() || !currentSession || !selectedAgent || isGenerating) {
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
      
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsTyping(false);
      
      // Check if streaming should be used
      const useStreaming = aiProvider === 'perplexity' || (aiProvider === 'openai' && !aiModel?.startsWith('gpt-5'));

      if (useStreaming) {
        // Get current session for authorization
        const session = await supabase.auth.getSession();
        if (!session.data.session?.access_token) {
          throw new Error('User not authenticated');
        }

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
      <div className="mx-auto max-w-7xl h-[calc(100vh-120px)] flex flex-col gap-6 p-4 md:p-6">
        
        {/* Clean Modern Header */}
        <header className="flex items-center justify-between gap-4 p-6 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                AI Playground
              </h1>
              <p className="text-sm text-muted-foreground">Работа с ИИ агентами</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Agent Selector */}
            <div className="min-w-0 max-w-sm">
              <SmartAgentSelector
                agents={userAgents}
                selectedAgent={selectedAgent}
                onSelectAgent={(agent) => startNewChat(agent)}
              />
            </div>
            
            {/* Status & Actions */}
            {selectedAgent && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm">
                  <Circle className={cn("w-2 h-2 rounded-full", 
                    isGenerating ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  )} />
                  <span className="hidden sm:inline">
                    {isGenerating ? 'Генерация...' : 'Готов'}
                  </span>
                </div>
                
                {currentSession && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearChat}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:ml-2 sm:inline">Очистить</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area - Full Width */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedAgent && currentSession ? (
            <Card className="flex-1 flex flex-col shadow-sm">
              {/* Compact Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base">{selectedAgent.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getProviderIcon(selectedAgent.aiProvider)}
                        <span>{selectedAgent.aiModel || 'default'}</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          {selectedAgent.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Session Info */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{currentSession.messages.length} сообщений</span>
                    {chatSessions.length > 1 && (
                      <span>• {chatSessions.length} чатов</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages Container */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {currentSession.messages.map((message) => (
                      <div key={message.id} className={cn(
                        "flex gap-3 group",
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}>
                        {/* Avatar */}
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium",
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        
                        {/* Message Content */}
                        <div className={cn(
                          "flex-1 min-w-0 max-w-[85%]",
                          message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'
                        )}>
                          {/* Message Bubble */}
                          <div className={cn(
                            "px-4 py-3 rounded-lg relative group/message",
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          )}>
                            {/* Copy Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyMessage(message.content)}
                              className={cn(
                                "absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover/message:opacity-100 transition-opacity",
                                message.role === 'user' ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                              )}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            
                            {/* Message Text */}
                            <div className="pr-8">
                              <div className={cn(
                                "prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                                message.role === 'user' 
                                  ? 'prose-invert [&_*]:text-primary-foreground' 
                                  : '[&_*]:text-foreground [&_code]:bg-background/50 [&_code]:text-foreground [&_pre]:bg-background/50'
                              )}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                          
                          {/* Timestamp */}
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Beautiful Streaming Animation */}
                    {isGenerating && streamingContent && (
                      <div className="flex gap-3 animate-fade-in">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                          <Bot className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0 max-w-[85%]">
                          <div className="px-4 py-3 rounded-lg bg-muted text-foreground relative overflow-hidden">
                            {/* Streaming gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse opacity-50" />
                            
                            <div className="relative">
                              <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_*]:text-foreground [&_code]:bg-background/50 [&_code]:text-foreground [&_pre]:bg-background/50">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {streamingContent}
                                </ReactMarkdown>
                              </div>
                              
                              {/* Animated cursor */}
                              <div className="inline-flex items-center mt-1">
                                <div className="w-2 h-4 bg-primary/60 animate-pulse rounded-sm" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Elegant Typing Indicator */}
                    {isTyping && !streamingContent && (
                      <div className="flex gap-3 animate-fade-in">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="px-4 py-3 rounded-lg bg-muted relative overflow-hidden">
                          {/* Thinking animation */}
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
                          
                          <div className="relative flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Обдумывает ответ</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '200ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '400ms' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                
                {/* Suggested Prompts */}
                {currentSession.messages.length === 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Рекомендуемые вопросы:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {suggestedPrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage(prompt)}
                          className="justify-start text-left h-auto p-3 text-xs hover:bg-muted"
                        >
                          <span className="line-clamp-2">{prompt}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Input Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Сообщение для ${selectedAgent.name}...`}
                      disabled={isGenerating}
                      className="pr-16"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {inputMessage.length}/1000
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isGenerating}
                    size="sm"
                    className="px-4"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            /* Clean Empty State */
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                
                <h2 className="text-xl font-semibold mb-3">
                  Выберите агента
                </h2>
                <p className="text-muted-foreground mb-6">
                  Выберите AI агента из списка выше для начала беседы. 
                  Каждый агент имеет свои специализации и возможности.
                </p>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Различные AI модели</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Персональные настройки</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Сохранение истории</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Playground;