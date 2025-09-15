import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Brain } from "lucide-react";
import { CreateTaskDialog } from "./CreateTaskDialog";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      {/* Main content с правильным отступом */}
      <div className="flex-1 flex flex-col min-w-0 ml-0">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">AI Agents Platform</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <CreateTaskDialog />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};