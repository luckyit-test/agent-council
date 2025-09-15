import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { AgentCard } from "@/components/AgentCard";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentDetailDialog } from "@/components/AgentDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  const [showMarketplaceAgents, setShowMarketplaceAgents] = useState(true);
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
      const shouldShow = showMarketplaceAgents ? true : agent.isCustom;
      return matchesSearch && shouldShow;
    });
  }, [searchQuery, userAgents, showMarketplaceAgents]);

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

        {/* Filter Toggle */}
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          <Label htmlFor="show-marketplace" className="text-sm">
            Показать агенты из маркетплейса
          </Label>
          <Switch
            id="show-marketplace"
            checked={showMarketplaceAgents}
            onCheckedChange={setShowMarketplaceAgents}
          />
        </div>

        {/* Agents List */}
        {filteredAgents.length > 0 ? (
          <div className="space-y-4">
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
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "Агенты не найдены" : "Нет агентов"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery 
                  ? "Попробуйте изменить поисковый запрос или выбрать другую категорию"
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
        )}

        {/* Create Agent CTA */}
        {filteredAgents.length > 0 && (
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