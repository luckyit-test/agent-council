import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { AgentCard } from "@/components/AgentCard";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentDetailDialog } from "@/components/AgentDetailDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Users } from "lucide-react";
import { getUserAgents, removeUserAgent, type UserAgent } from "@/utils/agentStorage";
import { useToast } from "@/hooks/use-toast";


const MyAgents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<UserAgent | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [filterType, setFilterType] = useState<"all" | "custom" | "marketplace">("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<UserAgent | null>(null);
  const { toast } = useToast();

  // Load user agents from localStorage
  useEffect(() => {
    const agents = getUserAgents();
    setUserAgents(agents);
  }, []);

  const filteredAgents = useMemo(() => {
    return userAgents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           agent.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterType === "all" || 
                           (filterType === "custom" && agent.isCustom) ||
                           (filterType === "marketplace" && !agent.isCustom);
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, userAgents, filterType]);

  const agentCounts = useMemo(() => {
    const custom = userAgents.filter(a => a.isCustom).length;
    const marketplace = userAgents.filter(a => !a.isCustom).length;
    return { custom, marketplace, total: custom + marketplace };
  }, [userAgents]);

  const handleAgentSelect = (agentId: string) => {
    const agent = userAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setDetailDialogOpen(true);
    }
  };

  const handleAgentEdit = (agentId: string) => {
    const agent = userAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setDetailDialogOpen(true);
    }
  };

  // Function to refresh agents list when new agent is created
  const refreshAgents = () => {
    const agents = getUserAgents();
    setUserAgents(agents);
  };

  const handleAgentDelete = (agentId: string) => {
    const agent = userAgents.find(a => a.id === agentId);
    if (agent) {
      setAgentToDelete(agent);
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = () => {
    if (!agentToDelete) return;
    
    const success = removeUserAgent(agentToDelete.id);
    if (success) {
      refreshAgents();
      toast({
        title: "Агент удален",
        description: `"${agentToDelete.name}" удален из ваших агентов`
      });
    } else {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить агента",
        variant: "destructive"
      });
    }
    
    setShowDeleteDialog(false);
    setAgentToDelete(null);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Мои агенты</h1>
            <p className="text-sm text-muted-foreground">
              Управляйте своими агентами ({agentCounts.total})
            </p>
          </div>
          <CreateAgentDialog onAgentCreated={refreshAgents} />
        </div>

        {/* Search and Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск агентов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">
                Все агенты ({agentCounts.total})
              </SelectItem>
              <SelectItem value="custom">
                Мои агенты ({agentCounts.custom})
              </SelectItem>
              <SelectItem value="marketplace">
                Из маркетплейса ({agentCounts.marketplace})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agents List */}
        {filteredAgents.length > 0 ? (
          <div className="space-y-3">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                {...agent}
                onSelect={handleAgentSelect}
                onEdit={handleAgentEdit}
                onDelete={handleAgentDelete}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterType !== "all" ? "Агенты не найдены" : "Нет агентов"}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm max-w-md">
                {searchQuery || filterType !== "all" 
                  ? "Попробуйте изменить поисковый запрос или фильтр"
                  : "Создайте своего первого агента или добавьте из маркетплейса"
                }
              </p>
              <div className="flex gap-2">
                {(searchQuery || filterType !== "all") && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("all");
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                )}
                <CreateAgentDialog onAgentCreated={refreshAgents} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Detail Dialog */}
        <AgentDetailDialog
          agent={selectedAgent}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onAgentUpdated={refreshAgents}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить агента?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы действительно хотите удалить агента "{agentToDelete?.name}"? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default MyAgents;