import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
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
import {
  ChevronDownIcon, UserIcon, LogOutIcon, ShieldIcon, EyeIcon,
  ChevronRightIcon, MenuIcon, XIcon,
  LayoutDashboard, Package, Tag, Settings, Users, Truck,
  FlaskConical, ShoppingCart, TrendingUp, ClipboardList,
  Newspaper, Factory, HardHat, FileText, Lock, ShieldCheck,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type AppUser = {
  id: number;
  email: string;
  rolesId: number;
  userType: 'admin' | 'client';
  role: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
};

type ModuleItem =
  | { id: string; label: string; icon: React.ReactNode; hasSubmenu?: false; submenu?: never }
  | { id: string; label: string; icon: React.ReactNode; hasSubmenu: true; submenu: { id: string; label: string; icon: React.ReactNode }[] };

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [user, setUser] = useState<AppUser | null>(null);
  const [isClientPreview, setIsClientPreview] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [configurationExpanded, setConfigurationExpanded] = useState(false);
  const [productionExpanded, setProductionExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [salesClientFilter, setSalesClientFilter] = useState<any>(null);

  const handleLogin = (userData: AppUser) => {
    setUser(userData);
    setIsLoggedIn(true);
    // El cliente entra directo a Mis Compras; el admin al dashboard
    setCurrentModule(userData.userType === 'client' ? 'client-purchases' : 'dashboard');
    localStorage.setItem('jrepuestos_user', JSON.stringify(userData));
  };

  useEffect(() => {
    if (['users', 'roles', 'permissions'].includes(currentModule)) {
      setConfigurationExpanded(true);
    }
  }, [currentModule]);

  useEffect(() => {
    if (['production-employees', 'production-orders-sub', 'production-technical-sheets'].includes(currentModule)) {
      setProductionExpanded(true);
    }
  }, [currentModule]);

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setCurrentModule('dashboard');
    setIsClientPreview(false);
    setSalesClientFilter(null);
    localStorage.removeItem('jrepuestos_user');
    localStorage.removeItem('jrepuestos_token');
  };

  const handleNavigateToSalesWithClient = (client: any) => {
    setSalesClientFilter(client);
    setCurrentModule('sales');
    setSidebarOpen(false);
  };

  const toggleClientPreview = () => {
    setIsClientPreview((prev) => {
      if (!prev && !['dashboard', 'catalog'].includes(currentModule)) {
        setCurrentModule('dashboard');
      }
      return !prev;
    });
    setSidebarOpen(false);
  };

  const toggleLandingPage = () => {
    setShowLandingPage((prev) => !prev);
    setSidebarOpen(false);
  };

  if (!isLoggedIn) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // user está garantizado no-null a partir de aquí
  const u = user!;

  if (showLandingPage) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <div className="relative">
          {u.userType === 'admin' && (
            <div className="fixed top-4 right-4 z-50">
              <Button onClick={toggleLandingPage} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                Ver Sistema Admin
              </Button>
            </div>
          )}
          <LandingPage
            onGoToSystem={toggleLandingPage}
            userType={u.userType}
          />
        </div>
      </>
    );
  }
  const getAvailableModules = (): ModuleItem[] => {
    const baseModules: ModuleItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'catalog',   label: 'Productos',  icon: <Package size={18} /> },
];

    if (isClientPreview) return baseModules;

    if (u.userType === 'admin') {
      return [
  ...baseModules,
  { id: 'product-categories', label: 'Categorías de productos', icon: <Tag size={18} /> },
  {
    id: 'configuration', label: 'Configuración', icon: <Settings size={18} />, hasSubmenu: true,
    submenu: [
      { id: 'users',       label: 'Usuarios', icon: <Users size={16} /> },
      { id: 'roles',       label: 'Roles',    icon: <Lock size={16} /> },
      { id: 'permissions', label: 'Permisos', icon: <ShieldCheck size={16} /> },
    ],
  },
  { id: 'clients',   label: 'Clientes',          icon: <Users size={18} /> },
  { id: 'suppliers', label: 'Proveedores',        icon: <Truck size={18} /> },
  { id: 'supplies',  label: 'Insumos',            icon: <FlaskConical size={18} /> },
  { id: 'purchases', label: 'Compras de insumos', icon: <ShoppingCart size={18} /> },
  { id: 'sales',     label: 'Ventas',             icon: <TrendingUp size={18} /> },
  { id: 'orders',    label: 'Pedidos',            icon: <ClipboardList size={18} /> },
  { id: 'news',                       label: 'Novedades',             icon: <Newspaper size={18} /> },
  { id: 'production-employees',        label: 'Empleados',             icon: <HardHat size={18} /> },
  { id: 'production-orders-sub',       label: 'Órdenes de Producción', icon: <Factory size={18} /> },
  { id: 'production-technical-sheets', label: 'Ficha Técnica',         icon: <FileText size={18} /> },
];
    }

    // Cliente registrado: Compras (ventas filtradas) + Pedidos + Productos
    return [
  { id: 'dashboard',        label: 'Dashboard',   icon: <LayoutDashboard size={18} /> },
  { id: 'catalog',          label: 'Productos',   icon: <Package size={18} /> },
  { id: 'client-purchases', label: 'Mis Compras', icon: <ShoppingCart size={18} /> },
  { id: 'client-orders',    label: 'Mis Pedidos', icon: <ClipboardList size={18} /> },
];
  };

  const renderModule = () => {
    const D = () => <Dashboard {...({} as any)} userType={isClient ? 'client' : 'admin'} />;

    switch (currentModule) {
      case 'dashboard':           return <Dashboard {...({} as any)} userType={isClient ? 'client' : 'admin'} />;
      case 'catalog':             return <ProductCatalog {...({} as any)} userType={isClient ? 'client' : 'admin'} />;
      // Módulos exclusivos del cliente — sin botón eliminar (clientMode=true)
      case 'client-purchases':    return <SalesModule {...({} as any)} clientMode clientFilter={{ id: u.id, name: u.name, email: u.email }} onClearClientFilter={() => {}} />;
      case 'client-orders':       return <OrderModule {...({} as any)} clientMode />;
      case 'my-purchases':        return <SalesModule {...({} as any)} clientMode clientFilter={{ id: u.id, name: u.name, email: u.email }} onClearClientFilter={() => {}} />;
      case 'my-profile':          return D();
      case 'configuration':       return !isClient ? <ConfigurationModule /> : D();
      case 'users':               return !isClient ? <UserManagement /> : D();
      case 'roles':               return !isClient ? <RoleManagement /> : D();
      case 'permissions':         return !isClient ? <PermissionManagement /> : D();
      case 'clients':             return !isClient ? <ClientManagement onNavigateToSales={handleNavigateToSalesWithClient as any} /> : D();
      case 'suppliers':           return !isClient ? <SupplierManagement /> : D();
      case 'supplies':            return !isClient ? <SupplyManagement /> : D();
      case 'product-categories':  return !isClient ? <ProductCategoryManagement /> : D();
      case 'sales':               return !isClient ? <SalesModule clientFilter={salesClientFilter} onClearClientFilter={() => setSalesClientFilter(null)} /> : D();
      case 'orders':              return !isClient ? <OrderModule /> : D();
      case 'purchases':           return !isClient ? <PurchaseModule /> : D();
      case 'news':                return !isClient ? <NewsModule /> : D();
      case 'production-employees':        return !isClient ? <EmployeeManagement /> : D();
      case 'production-orders-sub':       return !isClient ? <ProductionOrderModule /> : D();
      case 'production-technical-sheets': return !isClient ? <TechnicalSheetModule /> : D();
      default: return D();
    }
  };

  const getModuleTitle = (): string => {
    const titles: Record<string, string> = {
      dashboard:                      'Panel Principal',
      configuration:                  'Configuración del Sistema',
      users:                          'Gestión de Usuarios',
      roles:                          'Gestión de Roles',
      permissions:                    'Gestión de Permisos',
      catalog:                        'Productos',
      clients:                        'Gestión de Clientes',
      suppliers:                      'Gestión de Proveedores',
      supplies:                       'Gestión de Insumos',
      'product-categories':           'Categorías de productos',
      purchases:                      'Módulo de Compras de insumos',
      sales:                          'Módulo de Ventas',
      orders:                         'Módulo de Pedidos',
      news:                           'Novedades y Comunicados',
      'production-employees':         'Empleados de Producción',
      'production-orders-sub':        'Órdenes de Producción',
      'production-technical-sheets':  'Fichas Técnicas',
      'my-purchases':                 'Mis Compras',
      'my-profile':                   'Mi Perfil',
      'client-purchases':             'Mis Compras',
      'client-orders':                'Mis Pedidos',
    };
    return titles[currentModule] ?? 'Panel Principal';
  };

  const availableModules = getAvailableModules();
  const isClient = (u.userType as string) === 'client' || isClientPreview;

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-gray-100 flex relative">
        {sidebarOpen && (
          <div className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <Badge
                variant={u.userType === 'admin' ? 'default' : 'secondary'}
                className={u.userType === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
              >
                {u.userType === 'admin' ? (
                  <><ShieldIcon className="w-3 h-3 mr-1" />Administrador</>
                ) : (
                  <><UserIcon className="w-3 h-3 mr-1" />Cliente</>
                )}
              </Badge>

              {u.userType === 'admin' && (
                <Button onClick={toggleLandingPage} variant="outline" className="w-full text-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Ver Landing Page
                </Button>
              )}
            </div>
          </div>

          <nav className="flex-1 mt-6 px-4 pb-6 overflow-y-auto">
            {availableModules.map((item) => (
              <div key={item.id}>
                {item.hasSubmenu ? (
                  <div>
                    <button
                      onClick={() => {
                        if (item.id === 'configuration') {
                          if (configurationExpanded) setConfigurationExpanded(false);
                          else setCurrentModule('users');
                        } else if (item.id === 'production') {
                          if (productionExpanded) setProductionExpanded(false);
                          else setCurrentModule('production-employees');
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 mb-2 rounded-lg transition-colors ${
                        (item.id === 'configuration' && ['configuration', 'users', 'roles', 'permissions'].includes(currentModule)) ||
                        (item.id === 'production' && ['production-employees', 'production-orders-sub', 'production-technical-sheets'].includes(currentModule))
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRightIcon className={`w-4 h-4 transition-transform ${
                        (item.id === 'configuration' && configurationExpanded) ||
                        (item.id === 'production' && productionExpanded) ? 'rotate-90' : ''
                      }`} />
                    </button>

                    {((item.id === 'configuration' && configurationExpanded) ||
                      (item.id === 'production' && productionExpanded)) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => { setCurrentModule(sub.id); setSidebarOpen(false); }}
                            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                              currentModule === sub.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {sub.icon}
                            <span>{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setCurrentModule(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
                      currentModule === item.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          <div className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                  <MenuIcon className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl lg:text-2xl text-gray-900 truncate">{getModuleTitle()}</h2>
                {(isClient || isClientPreview) && (
                  <Badge variant="outline" className="text-green-600 border-green-200 hidden sm:flex">
                    {isClientPreview ? 'Vista Previa Cliente' : 'Vista Cliente'}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 lg:space-x-4">
                <div className="text-xs lg:text-sm text-gray-500 hidden md:block">
                  {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                    <div className={`w-6 lg:w-8 h-6 lg:h-8 rounded-full flex items-center justify-center ${u.userType === 'admin' && !isClientPreview ? 'bg-blue-600' : 'bg-green-600'}`}>
                      <span className="text-white text-xs lg:text-sm">{u.name?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm text-gray-900 truncate max-w-24 lg:max-w-none">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{isClientPreview ? 'Vista Previa Cliente' : u.role}</p>
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        {u.phone && <p className="text-xs text-gray-500">{u.phone}</p>}
                      </div>
                    </DropdownMenuItem>

                    {u.address && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center space-x-2">
                          <div className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-gray-500">Dirección</p>
                            <p className="text-sm">{u.address}</p>
                            {u.city && <p className="text-xs text-gray-500">{u.city}</p>}
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}

                    {u.userType === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={toggleClientPreview} className="flex items-center space-x-2">
                          <EyeIcon className="w-4 h-4" />
                          <span>{isClientPreview ? 'Desactivar' : 'Activar'} Vista Cliente</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={toggleLandingPage} className="flex items-center space-x-2">
                          <EyeIcon className="w-4 h-4" />
                          <span>Ver Landing Page</span>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600 focus:text-red-600">
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
    </>
  );
}

