import React, { useState, useEffect } from 'react';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { Dashboard } from '@/features/dashboard/pages/Dashboard';
import LandingPage from '@/features/dashboard/pages/LandingPage';
import { ConfigurationModule } from '@/features/configuration/pages/ConfigurationModule';
import { RoleManagement } from '@/features/roles/pages/RoleManagement';
import { UserManagement } from '@/features/users/pages/UserManagement';
import { PermissionManagement } from '@/features/permisos/pages/PermissionManagement';
import { EmployeeManagement } from '@/features/employed/pages/EmployeeManagement';
import { ProductCatalog } from '@/features/products/pages/ProductCatalog';
import { ProductCategoryManagement } from '@/features/products/pages/ProductCategoryManagement';
import { ClientManagement } from '@/features/clients/pages/ClientManagement';
import { SalesModule } from '@/features/sales/pages/SalesModule';
import { OrderModule } from '@/features/orders/pages/OrderModule';
import { ProductionOrderModule } from '@/features/orders/pages/ProductionOrderModule';
import { PurchaseModule } from '@/features/suppliers/pages/PurchaseModule';
import { SupplierManagement } from '@/features/suppliers/pages/SupplierManagement';
import { SupplyManagement } from '@/features/suppliers/pages/SupplyManagement';
import { TechnicalSheetModule } from '@/features/production/pages/TechnicalSheetModule';
import { NewsModule } from '@/features/employed/pages/NewsModule';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { ChevronDownIcon, UserIcon, LogOutIcon, ShieldIcon, EyeIcon, ChevronRightIcon, MenuIcon, XIcon } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isClientPreview, setIsClientPreview] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [configurationExpanded, setConfigurationExpanded] = useState(false);
  const [productionExpanded, setProductionExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [salesClientFilter, setSalesClientFilter] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('jrepuestos_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // Auto-expand configuration when users or roles are selected
  useEffect(() => {
    if (['users', 'roles', 'permissions'].includes(currentModule)) {
      setConfigurationExpanded(true);
    }
  }, [currentModule]);

  // Auto-expand production when production submenu is selected
  useEffect(() => {
    if (['production-employees', 'production-orders-sub', 'production-technical-sheets'].includes(currentModule)) {
      setProductionExpanded(true);
    }
  }, [currentModule]);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setCurrentModule('dashboard'); // Always start with dashboard
    localStorage.setItem('jrepuestos_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setCurrentModule('dashboard');
    setIsClientPreview(false);
    setSalesClientFilter(null);
    localStorage.removeItem('jrepuestos_user');
    localStorage.removeItem('jrepuestos_token');
  };

  const handleNavigateToSalesWithClient = (client) => {
    setSalesClientFilter(client);
    setCurrentModule('sales');
    setSidebarOpen(false);
  };

  const toggleClientPreview = () => {
    setIsClientPreview(!isClientPreview);
    // If switching to client preview, navigate to allowed modules
    if (!isClientPreview && !['dashboard', 'catalog'].includes(currentModule)) {
      setCurrentModule('dashboard');
    }
    // Close sidebar when toggling preview mode
    setSidebarOpen(false);
  };

  const toggleLandingPage = () => {
    setShowLandingPage(!showLandingPage);
    // Close sidebar when showing landing page
    setSidebarOpen(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show Landing Page for client users or when in preview mode
  if (showLandingPage || user.userType === 'client') {
    return (
      <div className="relative">
        {user.userType === 'admin' && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              onClick={toggleLandingPage}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              {showLandingPage ? 'Ver Sistema Admin' : 'Ver Landing Page'}
            </Button>
          </div>
        )}
        <LandingPage 
          onGoToSystem={user.userType === 'client' ? undefined : toggleLandingPage}
          userType={user.userType}
        />
      </div>
    );
  }

  // Define available modules based on user type or preview mode
  const getAvailableModules = () => {
    const baseModules = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'catalog', label: 'Productos', icon: '📦' },
    ];

    // If in client preview mode, only show base modules
    if (isClientPreview) {
      return baseModules;
    }

    // Admin users get access to all modules
    if (user.userType === 'admin') {
      return [
        ...baseModules,
        { id: 'product-categories', label: 'Categorías de productos', icon: '🏷️' },
        { 
          id: 'configuration', 
          label: 'Configuración', 
          icon: '⚙️',
          hasSubmenu: true,
          submenu: [
            { id: 'users', label: 'Usuarios', icon: '👥' },
            { id: 'roles', label: 'Roles', icon: '🔒' },
            { id: 'permissions', label: 'Permisos', icon: '🛡️' }
          ]
        },
        { id: 'clients', label: 'Clientes', icon: '👥' },
        { id: 'suppliers', label: 'Proveedores', icon: '🏭' },
        { id: 'supplies', label: 'Insumos', icon: '📋' },
        { id: 'purchases', label: 'Compras de insumos', icon: '🛒' },
        { id: 'sales', label: 'Ventas', icon: '💵' },
        { id: 'orders', label: 'Pedidos', icon: '📋' },
        { id: 'news', label: 'Novedades', icon: '📰' },
        { 
          id: 'production', 
          label: 'Producción', 
          icon: '🏭',
          hasSubmenu: true,
          submenu: [
            { id: 'production-employees', label: 'Empleados', icon: '👷' },
            { id: 'production-orders-sub', label: 'Órdenes de Producción', icon: '📋' },
            { id: 'production-technical-sheets', label: 'Ficha Técnica', icon: '📄' }
          ]
        },
      ];
    }

    // Client users only get dashboard and catalog
    return baseModules;
  };

  const renderModule = () => {
    // Use client preview mode if enabled for admin users
    const effectiveUserType = (user.userType === 'admin' && isClientPreview) ? 'client' : user.userType;
    
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard userType={effectiveUserType} />;
      case 'catalog':
        return <ProductCatalog userType={effectiveUserType} />;
      case 'configuration':
        return (user.userType === 'admin' && !isClientPreview) ? <ConfigurationModule /> : <Dashboard userType={effectiveUserType} />;
      case 'users':
        return (user.userType === 'admin' && !isClientPreview) ? <UserManagement /> : <Dashboard userType={effectiveUserType} />;
      case 'roles':
        return (user.userType === 'admin' && !isClientPreview) ? <RoleManagement /> : <Dashboard userType={effectiveUserType} />;
      case 'permissions':
        return (user.userType === 'admin' && !isClientPreview) ? <PermissionManagement /> : <Dashboard userType={effectiveUserType} />;
      case 'clients':
        return (user.userType === 'admin' && !isClientPreview) ? <ClientManagement onNavigateToSales={handleNavigateToSalesWithClient} /> : <Dashboard userType={effectiveUserType} />;
      case 'suppliers':
        return (user.userType === 'admin' && !isClientPreview) ? <SupplierManagement /> : <Dashboard userType={effectiveUserType} />;
      case 'supplies':
        return (user.userType === 'admin' && !isClientPreview) ? <SupplyManagement /> : <Dashboard userType={effectiveUserType} />;
      case 'product-categories':
        return (user.userType === 'admin' && !isClientPreview) ? <ProductCategoryManagement /> : <Dashboard userType={effectiveUserType} />;
      case 'sales':
        return (user.userType === 'admin' && !isClientPreview) ? <SalesModule clientFilter={salesClientFilter} onClearClientFilter={() => setSalesClientFilter(null)} /> : <Dashboard userType={effectiveUserType} />;
      case 'orders':
        return (user.userType === 'admin' && !isClientPreview) ? <OrderModule /> : <Dashboard userType={effectiveUserType} />;
      case 'purchases':
        return (user.userType === 'admin' && !isClientPreview) ? <PurchaseModule /> : <Dashboard userType={effectiveUserType} />;
      case 'news':
        return (user.userType === 'admin' && !isClientPreview) ? <NewsModule /> : <Dashboard userType={effectiveUserType} />;
      case 'production-employees':
        return (user.userType === 'admin' && !isClientPreview) ? <EmployeeManagement /> : <Dashboard userType={effectiveUserType} />;
      case 'production-orders-sub':
        return (user.userType === 'admin' && !isClientPreview) ? <ProductionOrderModule /> : <Dashboard userType={effectiveUserType} />;
      case 'production-technical-sheets':
        return (user.userType === 'admin' && !isClientPreview) ? <TechnicalSheetModule /> : <Dashboard userType={effectiveUserType} />;
      default:
        return <Dashboard userType={effectiveUserType} />;
    }
  };

  const getModuleTitle = () => {
    const titles = {
      dashboard: 'Panel Principal',
      configuration: 'Configuración del Sistema',
      users: 'Gestión de Usuarios',
      roles: 'Gestión de Roles',
      permissions: 'Gestión de Permisos',
      catalog: 'Productos',
      clients: 'Gestión de Clientes',
      suppliers: 'Gestión de Proveedores',
      supplies: 'Gestión de Insumos',
      'product-categories': 'Categorías de productos',
      purchases: 'Módulo de Compras de insumos',
      sales: 'Módulo de Ventas',
      orders: 'Módulo de Pedidos',
      news: 'Novedades y Comunicados',
      'production-employees': 'Empleados de Producción',
      'production-orders-sub': 'Órdenes de Producción',
      'production-technical-sheets': 'Fichas Técnicas',
    };
    return titles[currentModule] || 'Panel Principal';
  };

  const availableModules = getAvailableModules();

  return (
    <div className="min-h-screen bg-gray-100 flex relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 lg:w-10 h-8 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg lg:text-xl">J</span>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl text-gray-900">Jrepuestos</h1>
                <p className="text-xs lg:text-sm text-gray-500">Medellín</p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* User Type Badge */}
          <div className="mt-4 space-y-3">
            <Badge 
              variant={user.userType === 'admin' ? 'default' : 'secondary'}
              className={user.userType === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
            >
              {user.userType === 'admin' ? (
                <>
                  <ShieldIcon className="w-3 h-3 mr-1" />
                  Administrador
                </>
              ) : (
                <>
                  <UserIcon className="w-3 h-3 mr-1" />
                  Cliente
                </>
              )}
            </Badge>

            {/* Client Preview Toggle for Admin */}
            {user.userType === 'admin' && (
              <>
                <Button
                  onClick={toggleLandingPage}
                  variant="outline"
                  className="w-full text-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Ver Landing Page
                </Button>
              </>
            )}
          </div>
        </div>
        
        <nav className="flex-1 mt-6 px-4 pb-6 overflow-y-auto">
          {availableModules.map((item) => (
            <div key={item.id}>
              {item.hasSubmenu ? (
                <div>
                  {/* Parent button with submenu */}
                  <button
                    onClick={() => {
                      if (item.id === 'configuration') {
                        if (configurationExpanded) {
                          // Collapse the menu
                          setConfigurationExpanded(false);
                        } else {
                          // Expand and navigate to first submenu item
                          setCurrentModule('users');
                          // useEffect will handle expanding
                        }
                      } else if (item.id === 'production') {
                        if (productionExpanded) {
                          // Collapse the menu
                          setProductionExpanded(false);
                        } else {
                          // Expand and navigate to first submenu item
                          setCurrentModule('production-employees');
                          // useEffect will handle expanding
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 mb-2 rounded-lg transition-colors ${
                      (item.id === 'configuration' && ['configuration', 'users', 'roles'].includes(currentModule)) ||
                      (item.id === 'production' && ['production-employees', 'production-orders-sub', 'production-technical-sheets'].includes(currentModule))
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRightIcon 
                      className={`w-4 h-4 transition-transform ${
                        (item.id === 'configuration' && configurationExpanded) ||
                        (item.id === 'production' && productionExpanded)
                          ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>
                  
                  {/* Submenu */}
                  {((item.id === 'configuration' && configurationExpanded) ||
                    (item.id === 'production' && productionExpanded)) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((subitem) => (
                        <button
                          key={subitem.id}
                          onClick={() => {
                            setCurrentModule(subitem.id);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                            currentModule === subitem.id
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">{subitem.icon}</span>
                          <span>{subitem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCurrentModule(item.id);
                    // Close sidebar on mobile after selection
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
                    currentModule === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )}
            </div>
          ))}
          
          {/* Show restricted modules for client users or preview mode (grayed out) */}
          {(user.userType === 'client' || isClientPreview) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 mb-2 px-4">
                {isClientPreview ? 'Módulos de administrador' : 'Acceso restringido'}
              </p>
              {[
                { label: 'Categorías de productos', icon: '🏷️' },
                { label: 'Configuración', icon: '⚙️' },
                { label: 'Clientes', icon: '👥' },
                { label: 'Proveedores', icon: '🏭' },
                { label: 'Insumos', icon: '📋' },
                { label: 'Compras de insumos', icon: '🛒' },
                { label: 'Ventas', icon: '💵' },
                { label: 'Pedidos', icon: '📋' },
                { label: 'Producción', icon: '🏭' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg text-gray-300 cursor-not-allowed"
                >
                  <span className="text-lg opacity-50">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <MenuIcon className="w-5 h-5 text-gray-600" />
              </button>
              
              <h2 className="text-xl lg:text-2xl text-gray-900 truncate">{getModuleTitle()}</h2>
              {(user.userType === 'client' || isClientPreview) && (
                <Badge variant="outline" className="text-green-600 border-green-200 hidden sm:flex">
                  {isClientPreview ? 'Vista Previa Cliente' : 'Vista Cliente'}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="text-xs lg:text-sm text-gray-500 hidden md:block">
                {new Date().toLocaleDateString('es-CO', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                  <div className={`w-6 lg:w-8 h-6 lg:h-8 rounded-full flex items-center justify-center ${
                    user.userType === 'admin' && !isClientPreview ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    <span className="text-white text-xs lg:text-sm">{user?.name?.[0] || 'U'}</span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm text-gray-900 truncate max-w-24 lg:max-w-none">{user?.name || 'Usuario'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {isClientPreview ? 'Vista Previa Cliente' : (user?.role || 'Cliente')}
                    </p>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <div>
                      <p className="font-medium">{user?.name || 'Usuario'}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'Sin email'}</p>
                      {user?.phone && (
                        <p className="text-xs text-gray-500">{user.phone}</p>
                      )}
                    </div>
                  </DropdownMenuItem>
                  
                  {user?.address && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center space-x-2">
                        <div className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Dirección</p>
                          <p className="text-sm">{user.address}</p>
                          <p className="text-xs text-gray-500">{user.city}</p>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Admin Options in Dropdown */}
                  {user.userType === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={toggleClientPreview}
                        className="flex items-center space-x-2"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>{isClientPreview ? 'Desactivar' : 'Activar'} Vista Cliente</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={toggleLandingPage}
                        className="flex items-center space-x-2"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>Ver Landing Page</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-red-600 focus:text-red-600"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {renderModule()}
        </div>
      </div>
    </div>
  );
}