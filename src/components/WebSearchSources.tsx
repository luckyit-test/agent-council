import { ExternalLink, Globe, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WebSearchResult {
  id?: string;
  title?: string;
  url?: string;
  type?: string;
  status?: string;
}

interface WebSearchSourcesProps {
  results?: WebSearchResult[];
}

export const WebSearchSources = ({ results }: WebSearchSourcesProps) => {
  if (!results || results.length === 0) {
    return null;
  }

  // Фильтруем и группируем результаты
  const sources = results.filter(result => result.url && result.title);
  const searchCalls = results.filter(result => result.status);

  if (sources.length === 0 && searchCalls.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {searchCalls.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>Выполнен поиск в интернете</span>
          {searchCalls.map(call => call.status === 'completed' && (
            <Badge key={call.id} variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Завершено
            </Badge>
          ))}
        </div>
      )}
      
      {sources.length > 0 && (
        <Card className="border-l-4 border-l-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Источники:</span>
            </div>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover:text-primary truncate">
                      {source.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {source.url}
                    </div>
                  </div>
                  {source.type && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {source.type}
                    </Badge>
                  )}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};