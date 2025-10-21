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
import { WebSearchSources } from "@/components/WebSearchSources";
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
  Globe,
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
  webSearchResults?: WebSearchResult[];
  metadata?: {
    model?: string;
    hasWebSearch?: boolean;
    timestamp?: string;
  };
}

interface WebSearchResult {
  id?: string;
  title?: string;
  url?: string;
  type?: string;
  status?: string;
}

interface ChatSession {
  id: string;
  agentId: string;
  agentName: string;
  messages: Message[];
  createdAt: Date;
  context?: string; // Для сохранения контекста между сессиями
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

  // Load user agents and sessions
  useEffect(() => {
    const agents = getUserAgents();
    setUserAgents(agents);
    
    // Load chat sessions from localStorage with context
    const savedSessions = localStorage.getItem('chat-sessions');
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          context: s.context || '', // Загружаем сохраненный контекст
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
            webSearchResults: m.webSearchResults || [],
            metadata: m.metadata || {}
          }))
        }));
        setChatSessions(sessions);
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      }
    }
  }, []);

  // Save chat sessions to localStorage with context
  useEffect(() => {
    if (chatSessions.length > 0) {
      // Сохраняем только последние 10 сессий для производительности
      const sessionsToSave = chatSessions.slice(-10).map(session => ({
        ...session,
        // Сохраняем контекст: последние 5 сообщений для быстрого восстановления
        context: session.messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n'),
        messages: session.messages.map(m => ({
          ...m,
          // Убираем большие данные для экономии места
          content: m.content.length > 10000 ? m.content.substring(0, 10000) + '...' : m.content
        }))
      }));
      localStorage.setItem('chat-sessions', JSON.stringify(sessionsToSave));
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
      const useStreaming = true; // Включаем стриминг для всех провайдеров

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
                    
                    // Handle OpenAI Responses API streaming format (новый формат)
                    if (parsed.type === 'response.output_text.delta' && parsed.delta) {
                      // Получаем delta текст и добавляем к контенту
                      fullContent += parsed.delta;
                      setStreamingContent(fullContent);
                    }
                    // Handle complete response from Responses API
                    else if (parsed.type === 'response.output_text.done' && parsed.text) {
                      fullContent = parsed.text;
                      setStreamingContent(fullContent);
                    }
                    // Handle Responses API streaming format (старый формат)
                    else if (parsed.responses) {
                      // Обрабатываем ответ от Responses API
                      try {
                        const responsesData = JSON.parse(parsed.responses);
                        if (responsesData.output && Array.isArray(responsesData.output)) {
                          for (const outputItem of responsesData.output) {
                            if (outputItem.type === 'message' && outputItem.content) {
                              for (const contentItem of outputItem.content) {
                                if (contentItem.type === 'output_text' && contentItem.text) {
                                  fullContent = contentItem.text;
                                  setStreamingContent(fullContent);
                                }
                              }
                            }
                          }
                        }
                      } catch (e) {
                        // Если это не JSON, это может быть частичный ответ
                        fullContent += parsed.responses;
                        setStreamingContent(fullContent);
                      }
                    }
                    // Handle legacy streaming format (fallback)
                    else if (parsed.choices && parsed.choices[0]) {
                      if (parsed.choices[0].message && parsed.choices[0].message.content) {
                        // Complete response - replace all content
                        fullContent = parsed.choices[0].message.content;
                        setStreamingContent(fullContent);
                      } else if (parsed.choices[0].delta && parsed.choices[0].delta.content) {
                        // Streaming delta - append content
                        fullContent += parsed.choices[0].delta.content;
                        setStreamingContent(fullContent);
                      }
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
          agentId: selectedAgent.id,
          webSearchResults: data.webSearchResults,
          metadata: data.metadata
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
      <div className="h-[calc(100vh-120px)] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
          <div className="flex items-center gap-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">AI Playground</h1>
            
            <div className="min-w-[300px]">
              <SmartAgentSelector
                agents={userAgents}
                selectedAgent={selectedAgent}
                onSelectAgent={(agent) => startNewChat(agent)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
                      <h4 className="font-semibold mb-3">История с {selectedAgent.name}</h4>
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
                              <div className="flex flex-col gap-1">
                                <div className="text-sm font-medium">
                                  {session.messages.length > 0 ? 
                                    session.messages[0].content.slice(0, 50) + (session.messages[0].content.length > 50 ? '...' : '') :
                                    'Пустой чат'
                                  }
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTime(session.createdAt)} • {session.messages.length} сообщений
                                </div>
                              </div>
                            </Button>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Выберите агента для просмотра истории</p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

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

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          {!selectedAgent ? (
            <div className="h-full flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 max-w-md"
              >
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary/20">
                  <Brain className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Выберите агента</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Выберите AI-агента из списка выше, чтобы начать работу в Playground
                  </p>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              
              {/* Agent Info Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-gradient-to-r from-card/50 to-accent/5 rounded-xl border border-border/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center backdrop-blur-sm border border-primary/20">
                    {getProviderIcon(selectedAgent.aiProvider)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{selectedAgent.name}</h3>
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {selectedAgent.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-border/50">
                        {selectedAgent.aiProvider || 'openai'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
                  </div>
                </div>
              </motion.div>

              {/* Content Area */}
              <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-card/30 to-accent/5 rounded-xl border border-border/50 backdrop-blur-sm">
                
                {/* Messages/Output Area */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full p-6">
                    {(!currentSession || currentSession.messages.length === 0) && !streamingContent ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center py-12"
                      >
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-primary/20">
                          {getProviderIcon(selectedAgent.aiProvider)}
                        </div>
                        <h3 className="text-lg font-semibold mb-3">
                          Готов к работе с {selectedAgent.name}
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                          Введите ваш запрос ниже и получите детальный ответ от AI-агента
                        </p>
                        
                        {/* Suggested Prompts */}
                        <div className="space-y-3 w-full max-w-2xl">
                          <p className="text-sm text-muted-foreground">Попробуйте один из этих примеров:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {suggestedPrompts.map((prompt, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-left justify-start bg-card/50 backdrop-blur-sm border-border/50 hover:bg-accent/10 h-auto p-3"
                                onClick={() => setInputMessage(prompt)}
                              >
                                <span className="text-xs">{prompt}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-8">
                        {/* Previous Messages */}
                        {currentSession?.messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="space-y-4"
                          >
                            {message.role === 'user' && (
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <User className="w-4 h-4" />
                                <span>Ваш запрос:</span>
                                <span className="text-xs">{formatTime(message.timestamp)}</span>
                              </div>
                            )}
                            
                            {message.role === 'user' ? (
                              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                <p className="leading-relaxed">{message.content}</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                   <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                       <Bot className="w-4 h-4" />
                                       <span>Ответ {selectedAgent.name}:</span>
                                       <span className="text-xs">{formatTime(message.timestamp)}</span>
                                       {message.metadata?.model && (
                                         <Badge variant="outline" className="text-xs">
                                           {message.metadata.model}
                                         </Badge>
                                       )}
                                       {message.metadata?.hasWebSearch && (
                                         <Badge variant="secondary" className="text-xs">
                                           <Globe className="w-3 h-3 mr-1" />
                                           Web Search
                                         </Badge>
                                       )}
                                     </div>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                                       onClick={() => copyMessage(message.content)}
                                     >
                                       <Copy className="w-3 h-3" />
                                     </Button>
                                   </div>
                                
                                <div className="prose prose-sm max-w-none dark:prose-invert bg-card/30 border border-border/30 rounded-lg p-6 backdrop-blur-sm">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      code: ({ node, inline, className, children, ...props }: any) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                          <CodeBlock>{String(children).replace(/\n$/, '')}</CodeBlock>
                                        ) : (
                                          <InlineCode {...props}>{children}</InlineCode>
                                        );
                                      },
                                      blockquote: ({ children }: any) => (
                                        <Blockquote>{children}</Blockquote>
                                      ),
                                    }}
                                  >
                                     {message.content}
                                   </ReactMarkdown>
                                   
                                   {/* Веб-поисковые источники */}
                                   <WebSearchSources results={message.webSearchResults} />
                                 </div>
                               </div>
                            )}
                          </motion.div>
                        ))}

                        {/* Current Streaming Response */}
                        {streamingContent && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                          >
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Bot className="w-4 h-4" />
                               <span className="flex items-center gap-2">
                                 Генерирую ответ...
                                 <div className="flex gap-1">
                                   <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                                   <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
                                   <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
                                 </div>
                               </span>
                            </div>
                            
                            <div className="prose prose-sm max-w-none dark:prose-invert bg-card/30 border border-border/30 rounded-lg p-6 backdrop-blur-sm">
                              <AnimatedMessage 
                                content={streamingContent} 
                                isStreaming={isGenerating} 
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Generation Indicator */}
                        <AnimatePresence>
                          {(isGenerating || isTyping) && !streamingContent && (
                            <GenerationIndicator
                              isGenerating={isGenerating}
                              isTyping={isTyping}
                              elapsedTime={elapsedTime}
                              providerIcon={getProviderIcon(selectedAgent?.aiProvider)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-border/50 bg-card/20 backdrop-blur-sm">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={`Напишите ваш запрос для ${selectedAgent.name}...`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={isGenerating}
                        className="min-h-[48px] bg-background/50 backdrop-blur-sm border-border/50 text-base"
                      />
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isGenerating}
                      size="lg"
                      className="h-[48px] px-6 gap-2 bg-primary hover:bg-primary/90"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Отправить
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Playground;