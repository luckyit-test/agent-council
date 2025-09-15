import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { AgentCard } from "@/components/AgentCard";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentDetailDialog } from "@/components/AgentDetailDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
      return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, userAgents]);

  // Group agents by type
  const { customAgents, marketplaceAgents } = useMemo(() => {
    const custom: UserAgent[] = [];
    const marketplace: UserAgent[] = [];
    
    filteredAgents.forEach(agent => {
      if (agent.isCustom) {
        custom.push(agent);
      } else {
        marketplace.push(agent);
      }
    });
    
    return { customAgents: custom, marketplaceAgents: marketplace };
  }, [filteredAgents]);

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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Мои агенты</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ваши персональные агенты и добавленные из маркетплейса
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Поиск ваших агентов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>

        {/* Agents Groups */}
        {customAgents.length === 0 && marketplaceAgents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "Агенты не найдены" : "Нет агентов"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery 
                  ? "Попробуйте изменить поисковый запрос"
                  : "Создайте своего первого агента или выберите из маркетплейса"
                }
              </p>
              <div className="flex gap-3">
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                  >
                    Очистить поиск
                  </Button>
                )}
                <CreateAgentDialog onAgentCreated={refreshAgents} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Мои агенты */}
            {customAgents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Мои агенты</h2>
                  <Badge variant="secondary" className="text-xs">
                    {customAgents.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {customAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      {...agent}
                      onSelect={handleAgentSelect}
                      onEdit={handleAgentEdit}
                      onDelete={handleAgentDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Агенты из маркетплейса */}
            {marketplaceAgents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Из маркетплейса</h2>
                  <Badge variant="secondary" className="text-xs">
                    {marketplaceAgents.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {marketplaceAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      {...agent}
                      onSelect={handleAgentSelect}
                      onEdit={handleAgentEdit}
                      onDelete={handleAgentDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Agent CTA */}
        {(customAgents.length > 0 || marketplaceAgents.length > 0) && (
          <div className="text-center pt-8">
            <CreateAgentDialog onAgentCreated={refreshAgents} />
          </div>
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