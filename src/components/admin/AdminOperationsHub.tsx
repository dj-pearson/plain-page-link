import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, AlertCircle, Zap } from "lucide-react";
import { UserManagementPanel } from "./UserManagementPanel";
import { SystemHealthMonitor } from "./SystemHealthMonitor";
import { ErrorLogViewer } from "./ErrorLogViewer";

export const AdminOperationsHub = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Operations Hub</h1>
        <p className="text-muted-foreground">
          Centralized admin operations, user management, and system monitoring
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>System Health</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Error Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagementPanel />
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <SystemHealthMonitor />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <ErrorLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};
