import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatedMessage } from "@/components/AnimatedMessage";
import { CodeBlock } from "@/components/CodeBlock";
import { Blockquote, InlineCode } from "@/components/StylizedBlocks";
import { GenerationIndicator } from "@/components/GenerationIndicator";
import { motion, AnimatePresence } from "framer-motion";
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
  }, [currentSession?.messages, streamingContent]);

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
                      <h4 className="font-semibold mb-3">История чатов с {selectedAgent.name}</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {chatSessions
                          .filter(session => session.agentId === selectedAgent.id)
                          .slice(0, 10)
                          .map((session) => (
                            <Button
                              key={session.id}
                              variant="ghost" 
                              className="w-full justify-start text-left h-auto p-3"
                              onClick={() => setCurrentSession(session)}
                            >
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {session.messages.length > 0 
                                    ? session.messages[0].content.slice(0, 50) + '...'
                                    : 'Пустой чат'
                                  }
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTime(session.createdAt)} • {session.messages.length} сообщений
                                </div>
                              </div>
                            </Button>
                          ))}
                        {chatSessions.filter(s => s.agentId === selectedAgent.id).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Нет истории чатов с этим агентом
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Выберите агента для просмотра истории
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Chat Button - показываем только если есть сообщения */}
            {currentSession && currentSession.messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Очистить
              </Button>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col bg-background rounded-lg border shadow-sm overflow-hidden">
          {!selectedAgent ? (
            /* Agent Selection State */
            <div className="flex-1 flex items-center justify-center">
              <Card className="max-w-md">
                <CardHeader className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <CardTitle>Выберите агента</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Выберите агента из списка выше, чтобы начать разговор
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentSession && currentSession.messages.length === 0 ? (
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
                    <>
                      {/* Generation Indicator */}
                      <AnimatePresence>
                        {(isGenerating || isTyping) && (
                          <GenerationIndicator
                            isGenerating={isGenerating}
                            isTyping={isTyping}
                            elapsedTime={elapsedTime}
                            providerIcon={getProviderIcon(selectedAgent?.aiProvider)}
                          />
                        )}
                      </AnimatePresence>

                      {/* Messages */}
                      <AnimatePresence>
                        {currentSession?.messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                              "flex gap-4 group relative mb-6",
                              message.role === 'user' ? "justify-end" : "justify-start"
                            )}
                          >
                            <Card className="relative max-w-[80%] p-5 shadow-lg border bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                              
                              {/* Message Header */}
                              <div className="flex items-start gap-3 mb-3">
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.1, type: "spring" }}
                                  className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ring-2 ring-offset-2 ring-offset-background",
                                    message.role === 'user' 
                                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-primary/20" 
                                      : "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground ring-secondary/20"
                                  )}
                                >
                                  {message.role === 'user' ? (
                                    <User className="w-4 h-4" />
                                  ) : (
                                    <Bot className="w-4 h-4" />
                                  )}
                                </motion.div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                      {message.role === 'user' ? 'Вы' : selectedAgent?.name || 'AI Assistant'}
                                    </span>
                                    <span className="text-xs text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
                                      {formatTime(message.timestamp)}
                                    </span>
                                  </div>
                                  
                                  {message.role === 'assistant' && selectedAgent && (
                                    <motion.div 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.2 }}
                                      className="flex items-center gap-1 mt-1"
                                    >
                                      <Badge variant="outline" className="text-xs gap-1.5 bg-background/80 backdrop-blur-sm border-primary/30">
                                        {getProviderIcon(selectedAgent.aiProvider)}
                                        {selectedAgent.aiModel || selectedAgent.aiProvider || 'AI'}
                                      </Badge>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Message Content */}
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                {message.role === 'user' ? (
                                  <p className="text-foreground leading-relaxed whitespace-pre-wrap mb-0">
                                    {message.content}
                                  </p>
                                ) : (
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      code: ({ node, inline, className, children, ...props }: any) => {
                                        const content = String(children).replace(/\n$/, '');
                                        if (inline) {
                                          return <InlineCode>{content}</InlineCode>;
                                        }
                                        return <CodeBlock className={className}>{content}</CodeBlock>;
                                      },
                                      blockquote: ({ children }) => (
                                        <Blockquote>{children}</Blockquote>
                                      ),
                                      h1: ({ children }) => (
                                        <motion.h1 
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3 mt-6 first:mt-0"
                                        >
                                          {children}
                                        </motion.h1>
                                      ),
                                      h2: ({ children }) => (
                                        <motion.h2 
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3 mt-5 first:mt-0"
                                        >
                                          {children}
                                        </motion.h2>
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
                                        <ul className="space-y-2 text-foreground my-3">
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal list-inside space-y-2 text-foreground my-3">
                                          {children}
                                        </ol>
                                      ),
                                      li: ({ children }) => (
                                        <motion.li 
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          className="text-foreground flex items-start gap-2"
                                        >
                                          <div className="w-1.5 h-1.5 mt-2 shrink-0 bg-primary rounded-full" />
                                          <span className="flex-1">{children}</span>
                                        </motion.li>
                                      ),
                                      table: ({ children }) => (
                                        <div className="overflow-hidden rounded-lg border border-border my-4 shadow-sm">
                                          <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                              {children}
                                            </table>
                                          </div>
                                        </div>
                                      ),
                                      th: ({ children }) => (
                                        <th className="border-r border-border px-4 py-3 bg-gradient-to-r from-muted to-muted/80 font-semibold text-left text-foreground last:border-r-0">
                                          {children}
                                        </th>
                                      ),
                                      td: ({ children }) => (
                                        <td className="border-r border-border border-t border-border/30 px-4 py-3 text-foreground last:border-r-0">
                                          {children}
                                        </td>
                                      ),
                                      strong: ({ children }) => (
                                        <strong className="font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
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

                              {/* Action Buttons */}
                              {message.role === 'assistant' && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  whileHover={{ opacity: 1, y: 0 }}
                                  className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyMessage(message.content)}
                                    className="h-8 px-3 text-xs bg-background/80 hover:bg-background border border-border/50 hover:shadow-md transition-all"
                                  >
                                    <Copy className="w-3 h-3 mr-1.5" />
                                    Копировать
                                  </Button>
                                </motion.div>
                              )}
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {/* Streaming content */}
                      {isGenerating && streamingContent && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-4 justify-start mb-6"
                        >
                          <Card className="relative max-w-[80%] p-5 shadow-lg border bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm">
                            
                            {/* Streaming Header */}
                            <div className="flex items-start gap-3 mb-3">
                              <motion.div 
                                animate={{ 
                                  scale: [1, 1.1, 1],
                                  boxShadow: [
                                    "0 0 0 0 rgba(59, 130, 246, 0.5)",
                                    "0 0 0 10px rgba(59, 130, 246, 0)",
                                    "0 0 0 0 rgba(59, 130, 246, 0)"
                                  ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground ring-2 ring-secondary/20 ring-offset-2 ring-offset-background"
                              >
                                <Bot className="w-4 h-4" />
                              </motion.div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">
                                    {selectedAgent?.name || 'AI Assistant'}
                                  </span>
                                  <motion.div 
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full"
                                  >
                                    {[0, 1, 2].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-1 h-1 bg-primary rounded-full"
                                        animate={{
                                          scale: [1, 1.5, 1],
                                          opacity: [0.5, 1, 0.5]
                                        }}
                                        transition={{
                                          duration: 1,
                                          repeat: Infinity,
                                          delay: i * 0.2
                                        }}
                                      />
                                    ))}
                                    <span className="text-xs text-primary font-medium ml-1">Генерирую</span>
                                  </motion.div>
                                </div>
                                
                                {selectedAgent && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Badge variant="outline" className="text-xs gap-1.5 bg-background/80 backdrop-blur-sm border-primary/30">
                                      {getProviderIcon(selectedAgent.aiProvider)}
                                      {selectedAgent.aiModel || selectedAgent.aiProvider || 'AI'}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Streaming Content with typing animation */}
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <AnimatedMessage 
                                content={streamingContent}
                                isStreaming={true}
                                className="text-foreground leading-relaxed"
                              />
                            </div>
                          </Card>
                        </motion.div>
                      )}
                    </>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={selectedAgent ? `Напишите сообщение для ${selectedAgent.name}...` : "Выберите агента для начала чата..."}
                      disabled={!selectedAgent || isGenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="min-h-[2.5rem] resize-none bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50"
                    />
                  </div>
                  
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || !selectedAgent || isGenerating}
                    size="icon"
                    className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Playground;