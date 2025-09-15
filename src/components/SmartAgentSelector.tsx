import { useState, useEffect, useRef } from "react";
import { Bot, Search, Star, Clock, Zap, Shield, Brain, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type UserAgent } from "@/utils/agentStorage";

interface SmartAgentSelectorProps {
  agents: UserAgent[];
  selectedAgent: UserAgent | null;
  onSelectAgent: (agent: UserAgent) => void;
}

interface AgentGroup {
  type: 'recent' | 'favorites' | 'analyst' | 'creative' | 'technical' | 'other';
  label: string;
  agents: UserAgent[];
  color: string;
}

export const SmartAgentSelector = ({ agents, selectedAgent, onSelectAgent }: SmartAgentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [recentAgents, setRecentAgents] = useState<string[]>([]);
  const [favoriteAgents, setFavoriteAgents] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent and favorite agents from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recent-agents') || '[]');
    const favorites = JSON.parse(localStorage.getItem('favorite-agents') || '[]');
    setRecentAgents(recent);
    setFavoriteAgents(favorites);
  }, []);

  // Auto-focus search when opening
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    if (!open) {
      setExpandedAgent(null);
      setSearchQuery("");
    }
  }, [open]);

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'openai': return <Zap className="w-3 h-3" />;
      case 'anthropic': return <Shield className="w-3 h-3" />;
      case 'google': return <Brain className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'analyst': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50';
      case 'creative': return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/50';
      case 'technical': return 'text-primary bg-primary/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const toggleFavorite = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favoriteAgents.includes(agentId)
      ? favoriteAgents.filter(id => id !== agentId)
      : [...favoriteAgents, agentId];
    setFavoriteAgents(newFavorites);
    localStorage.setItem('favorite-agents', JSON.stringify(newFavorites));
  };

  const handleAgentSelect = (agent: UserAgent) => {
    // Update recent agents
    const newRecent = [agent.id, ...recentAgents.filter(id => id !== agent.id)].slice(0, 5);
    setRecentAgents(newRecent);
    localStorage.setItem('recent-agents', JSON.stringify(newRecent));
    
    onSelectAgent(agent);
    setOpen(false);
  };

  const toggleExpanded = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
  };

  // Filter and group agents
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = !providerFilter || agent.aiProvider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  const groupedAgents: AgentGroup[] = [
    {
      type: 'recent' as const,
      label: 'Недавние',
      agents: recentAgents.map(id => agents.find(a => a.id === id)).filter(Boolean) as UserAgent[],
      color: 'text-orange-600'
    },
    {
      type: 'favorites' as const,
      label: 'Избранные',
      agents: favoriteAgents.map(id => agents.find(a => a.id === id)).filter(Boolean) as UserAgent[],
      color: 'text-yellow-600'
    },
    {
      type: 'analyst' as const,
      label: 'Аналитики',
      agents: filteredAgents.filter(a => a.type === 'analyst'),
      color: 'text-blue-600'
    },
    {
      type: 'creative' as const,
      label: 'Креативные',
      agents: filteredAgents.filter(a => a.type === 'creative'),
      color: 'text-purple-600'
    },
    {
      type: 'technical' as const,
      label: 'Технические',
      agents: filteredAgents.filter(a => a.type === 'technical'),
      color: 'text-green-600'
    },
    {
      type: 'other' as const,
      label: 'Другие',
      agents: filteredAgents.filter(a => !['analyst', 'creative', 'technical'].includes(a.type)),
      color: 'text-gray-600'
    }
  ].filter(group => group.agents.length > 0);

  const providers = [...new Set(agents.map(a => a.aiProvider).filter(Boolean))];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
        >
          {selectedAgent ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3" />
              </div>
              <span className="font-medium truncate">{selectedAgent.name}</span>
              {selectedAgent.aiProvider && (
                <div className="flex items-center gap-1 shrink-0">
                  {getProviderIcon(selectedAgent.aiProvider)}
                  <Badge variant="secondary" className="text-xs h-4">
                    {selectedAgent.aiModel}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Выберите агента для чата</span>
          )}
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[min(450px,90vw)] p-0" align="start">
        <div className="flex flex-col h-[min(500px,80vh)]">
          {/* Search Header */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Поиск агентов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Provider Filters */}
            {providers.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={providerFilter === "" ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setProviderFilter("")}
                >
                  Все
                </Button>
                {providers.map(provider => (
                  <Button
                    key={provider}
                    variant={providerFilter === provider ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setProviderFilter(provider === providerFilter ? "" : provider)}
                  >
                    <div className="flex items-center gap-1">
                      {getProviderIcon(provider)}
                      <span className="capitalize">{provider}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Agents List */}
          <ScrollArea className="flex-1">
            <div className="p-3">
              {groupedAgents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Агенты не найдены" : "Нет доступных агентов"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedAgents.map(group => (
                    <div key={group.type}>
                      <div className="flex items-center gap-2 mb-2">
                        {group.type === 'recent' && <Clock className="w-4 h-4 text-orange-600" />}
                        {group.type === 'favorites' && <Star className="w-4 h-4 text-yellow-600" />}
                        <h4 className={cn("text-sm font-medium", group.color)}>
                          {group.label}
                        </h4>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      
                      <div className="space-y-1">
                        {group.agents.map(agent => (
                          <div key={agent.id} className="space-y-1">
                            {/* Main Agent Row */}
                            <div
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                                "hover:bg-secondary",
                                selectedAgent?.id === agent.id && "bg-secondary",
                                expandedAgent === agent.id && "bg-secondary"
                              )}
                              onClick={() => handleAgentSelect(agent)}
                            >
                              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot className="w-3 h-3" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">{agent.name}</span>
                                  {agent.aiProvider && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      {getProviderIcon(agent.aiProvider)}
                                      <Badge variant="secondary" className="text-xs h-4">
                                        {agent.aiModel}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {agent.description}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => toggleFavorite(agent.id, e)}
                                >
                                  <Star className={cn(
                                    "w-3 h-3",
                                    favoriteAgents.includes(agent.id) 
                                      ? "fill-yellow-400 text-yellow-400" 
                                      : "text-muted-foreground"
                                  )} />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => toggleExpanded(agent.id, e)}
                                >
                                  <ChevronDown className={cn(
                                    "w-3 h-3 transition-transform",
                                    expandedAgent === agent.id && "rotate-180"
                                  )} />
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedAgent === agent.id && (
                              <div className="ml-9 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/20">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("text-xs px-2 py-1 rounded font-medium", getTypeColor(agent.type))}>
                                      {agent.type}
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {agent.description}
                                  </p>
                                  
                                  {agent.aiProvider && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {getProviderIcon(agent.aiProvider)}
                                      <span>{agent.aiProvider}</span>
                                      <span>•</span>
                                      <span>{agent.aiModel}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};