import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { RoleManagement } from '@/features/users/pages/RoleManagement';
import { UserManagement } from '@/features/users/pages/UserManagement';
import { 
  ShieldIcon, 
  UsersIcon, 
  SettingsIcon,
  Users2Icon,
  LockIcon
} from 'lucide-react';

export function ConfigurationModule() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Gestiona usuarios, roles y permisos del sistema</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2 text-blue-900 border-blue-200 bg-blue-50">
            <SettingsIcon className="w-4 h-4" />
            Configuración
          </Badge>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4" />
              Roles
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <SettingsIcon className="w-4 h-4" />
            <span>Módulo de Configuración</span>
          </div>
        </div>

        {/* Users Tab Content */}
        <TabsContent value="users" className="space-y-0">
          <UserManagement />
        </TabsContent>

        {/* Roles Tab Content */}
        <TabsContent value="roles" className="space-y-0">
          <RoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}