import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Zap, TrendingUp, Clock } from "lucide-react";

interface AgentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewFilter: "all" | "my" | "marketplace";
  onViewFilterChange: (value: "all" | "my" | "marketplace") => void;
}

const agentTypes = [
  { value: "all", label: "Все типы" },
  { value: "analyst", label: "Аналитик" },
  { value: "creative", label: "Творческий" },
  { value: "technical", label: "Технический" },
  { value: "judge", label: "Судья" },
  { value: "researcher", label: "Исследователь" }
];

export const AgentFilters = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortChange,
  viewFilter,
  onViewFilterChange
}: AgentFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Main search and view filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Поиск агентов по названию или описанию..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewFilterChange("all")}
            className="min-w-[80px]"
          >
            Все
          </Button>
          <Button
            variant={viewFilter === "my" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewFilterChange("my")}
            className="min-w-[80px]"
          >
            Мои
          </Button>
          <Button
            variant={viewFilter === "marketplace" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewFilterChange("marketplace")}
            className="min-w-[120px]"
          >
            Маркетплейс
          </Button>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {agentTypes.map((type) => (
          <Badge
            key={type.value}
            variant={typeFilter === type.value ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => onTypeFilterChange(type.value)}
          >
            {type.label}
          </Badge>
        ))}
      </div>

      {/* Sort and additional filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Сортировка:</span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={sortBy === "popular" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("popular")}
            className="flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Популярные
          </Button>
          <Button
            variant={sortBy === "rating" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("rating")}
            className="flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            По рейтингу
          </Button>
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("recent")}
            className="flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            Недавние
          </Button>
        </div>
      </div>
    </div>
  );
};