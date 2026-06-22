import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { Dashboard } from '@/features/dashboard/pages/Dashboard';
import LandingPage from '@/features/dashboard/pages/LandingPage';
import { ConfigurationModule } from '@/features/configuration/pages/ConfigurationModule';
import { AdminProfile } from '@/features/configuration/pages/AdminProfile';
import { RoleManagement } from '@/features/roles/pages/RoleManagement';
import { UserManagement } from '@/features/users/pages/UserManagement';
import { EmployeeManagement } from '@/features/employed/pages/EmployeeManagement';
import { ProductCatalog } from '@/features/products/pages/ProductCatalog';
import { ProductCategoryManagement } from '@/features/products/pages/ProductCategoryManagement';
import { ClientManagement } from '@/features/clients/pages/ClientManagement';
import { ClientProfile } from '@/features/clients/pages/ClientProfile';
import { SalesModule } from '@/features/sales/pages/SalesModule';
import { PurchaseModule } from '@/features/suppliers/pages/PurchaseModule';
import { SupplierManagement } from '@/features/suppliers/pages/SupplierManagement';
import { SupplyManagement } from '@/features/suppliers/pages/SupplyManagement';
import { TechnicalSheetModule } from '@/features/production/pages/TechnicalSheetModule';
import { CartProvider } from '@/shared/context/CartContext';
import { CartDrawer }   from '@/shared/components/CartDrawer';
import { CartButton }   from '@/shared/components/CartButton';
import { ProductionModule } from '@/features/production/pages/ProductionModule';
import { NewsModule } from '@/features/employed/pages/NewsModule';
import { PayrollModule } from '@/features/nomina/pages/nomina';
import { MODULE_KEY_MAP } from '@/shared/services/modulesService';
import { usePermissions } from '@/context/PermissionContext';
import { AccessDenied } from '@/shared/components/AccessDenied';
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
  FlaskConical, ShoppingCart, TrendingUp,
  Newspaper, Factory, HardHat, FileText, Lock, DollarSign, HelpCircle,
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
  const [showLandingFirst, setShowLandingFirst] = useState(true);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [user, setUser] = useState<AppUser | null>(null);
  const [isClientPreview, setIsClientPreview] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [configurationExpanded, setConfigurationExpanded] = useState(false);
  const [productionExpanded, setProductionExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [salesClientFilter, setSalesClientFilter] = useState<any>(null);
  const {
    allowedModuleKeys,
    isLoaded:    modulesLoaded,
    hasApiError: modulesApiError,
    loadPermissions,
    clearPermissions,
  } = usePermissions();

  // Restaurar sesión desde localStorage al cargar la app
  useEffect(() => {
    const storedToken = localStorage.getItem('jrepuestos_token');
    const storedUser  = localStorage.getItem('jrepuestos_user');
    if (!storedToken || !storedUser) return;
    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('jrepuestos_token');
        localStorage.removeItem('jrepuestos_user');
        return;
      }
      const userData: AppUser = JSON.parse(storedUser);
      setUser(userData);
      setIsLoggedIn(true);
      setShowLandingFirst(false);
    } catch {
      localStorage.removeItem('jrepuestos_token');
      localStorage.removeItem('jrepuestos_user');
    }
  }, []);

  // Cargar módulos permitidos cuando el usuario cambia
  useEffect(() => {
    if (user && user.rolesId) {
      loadPermissions(user.rolesId);
    }
  }, [user?.rolesId]);

  const handleLogin = (userData: AppUser) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowLandingPage(false);
    setShowLandingFirst(false);
    setCurrentModule(userData.userType === 'client' ? 'client-purchases' : 'dashboard');
    localStorage.setItem('jrepuestos_user', JSON.stringify(userData));
};

  useEffect(() => {
    if (['users', 'roles'].includes(currentModule)) {
      setConfigurationExpanded(true);
    }
  }, [currentModule]);

  useEffect(() => {
    if (['production-employees', 'production-orders-sub', 'production-technical-sheets'].includes(currentModule)) {
      setProductionExpanded(true);
    }
  }, [currentModule]);

  // RBAC guard: el rol Cliente nunca debe ver el Dashboard.
  // Si por cualquier motivo currentModule === 'dashboard', redirige al primer módulo disponible.
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    if (user.userType === 'client' && !isClientPreview && currentModule === 'dashboard') {
      setCurrentModule('client-purchases');
    }
  }, [isLoggedIn, user?.userType, isClientPreview, currentModule]);

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setCurrentModule('dashboard');
    setIsClientPreview(false);
    setSalesClientFilter(null);
    setShowLandingFirst(true);
    clearPermissions();
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
    if (showLandingFirst) {
      return (
        <CartProvider>
          <Toaster richColors position="top-right" />
          <LandingPage onGoToSystem={() => setShowLandingFirst(false)} />
          <CartDrawer />
          <CartButton />
        </CartProvider>
      );
    }
    return (
      <>
        <Toaster richColors position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // user está garantizado no-null a partir de aquí
  const u = user!;


  // Verifica si un módulo está permitido — accesible desde getAvailableModules y renderModule
  const isModuleAllowed = (moduleId: string): boolean => {
    if (!modulesLoaded) {
      return u.userType === 'client'
        ? ['catalog', 'client-purchases'].includes(moduleId)
        : ['dashboard', 'catalog'].includes(moduleId);
    }
    if (modulesApiError) {
      return u.userType === 'client'
        ? ['catalog', 'client-purchases'].includes(moduleId)
        : true;
    }
    if (allowedModuleKeys.length === 0) {
      return u.userType === 'client'
        ? ['catalog', 'client-purchases'].includes(moduleId)
        : true;
    }
    return allowedModuleKeys.some(key =>
      MODULE_KEY_MAP[key] === moduleId || key === moduleId
    );
  };

  const getAvailableModules = (): ModuleItem[] => {
    const baseModules: ModuleItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'catalog',   label: 'Productos',  icon: <Package size={18} /> },
    ];

    if (isClientPreview) return baseModules;

    if (u.userType === 'admin') {
      const adminModules = [
        ...baseModules,
        { id: 'product-categories', label: 'Categorías de productos', icon: <Tag size={18} /> },
        {
          id: 'configuration', label: 'Configuración', icon: <Settings size={18} />, hasSubmenu: true as const,
          submenu: [
            { id: 'users',       label: 'Usuarios',         icon: <Users size={16} /> },
            { id: 'roles',       label: 'Roles y Permisos', icon: <Lock size={16} /> },
          ].filter(sub => isModuleAllowed(sub.id)),
        },
        { id: 'clients',   label: 'Clientes',          icon: <Users size={18} /> },
        { id: 'suppliers', label: 'Proveedores',        icon: <Truck size={18} /> },
        { id: 'supplies',  label: 'Insumos',            icon: <FlaskConical size={18} /> },
        { id: 'purchases', label: 'Compras de insumos', icon: <ShoppingCart size={18} /> },
        { id: 'sales',     label: 'Ventas',             icon: <TrendingUp size={18} /> },
        { id: 'news',                       label: 'Novedades',             icon: <Newspaper size={18} /> },
        { id: 'production-employees',        label: 'Empleados',             icon: <HardHat size={18} /> },
        { id: 'production-orders-sub',       label: 'Órdenes de Producción', icon: <Factory size={18} /> },
        { id: 'production-technical-sheets', label: 'Ficha Técnica',         icon: <FileText size={18} /> },
        { id: 'nomina',                       label: 'Control de Pagos',      icon: <DollarSign size={18} /> },
      ].filter((module): module is ModuleItem => {
        if (module.hasSubmenu) return module.submenu.length > 0;
        return isModuleAllowed(module.id);
      }) as ModuleItem[];

      return adminModules;
    }

    // Cliente registrado: solo los módulos que le fueron asignados
    const clientModules: ModuleItem[] = [
      { id: 'catalog',          label: 'Productos',   icon: <Package size={18} /> },
      { id: 'client-purchases', label: 'Mis Compras', icon: <ShoppingCart size={18} /> },
    ].filter(module => isModuleAllowed(module.id));

    return clientModules;
  };

  // Módulos siempre accesibles sin importar los permisos del rol
  const ALWAYS_ACCESSIBLE = new Set(['settings', 'dashboard', 'catalog', 'client-purchases', 'my-purchases', 'my-profile']);

  const renderModule = () => {
    // Guard: admins no-Administrador con permisos ya cargados y sin errores de API
    if (
      u.userType === 'admin' &&
      !isClientPreview &&
      modulesLoaded &&
      !modulesApiError &&
      allowedModuleKeys.length > 0 &&
      !ALWAYS_ACCESSIBLE.has(currentModule) &&
      !isModuleAllowed(currentModule)
    ) {
      return <AccessDenied onGoBack={() => setCurrentModule('dashboard')} />;
    }

    const D = () => <Dashboard {...({} as any)} userType={isClient ? 'client' : 'admin'} />;

    switch (currentModule) {
      case 'dashboard':           return <Dashboard {...({} as any)} userType={isClient ? 'client' : 'admin'} />;
      case 'catalog':             return <ProductCatalog {...({} as any)} userType={isClient ? 'client' : 'admin'} />;
      // Módulos exclusivos del cliente — sin botón eliminar (clientMode=true)
      case 'client-purchases':    return <SalesModule {...({} as any)} clientMode clientFilter={{ id: u.id, name: u.name, email: u.email }} onClearClientFilter={() => {}} />;
      case 'my-purchases':        return <SalesModule {...({} as any)} clientMode clientFilter={{ id: u.id, name: u.name, email: u.email }} onClearClientFilter={() => {}} />;
      case 'settings':            return isClient ? <ClientProfile /> : <AdminProfile />;
      case 'my-profile':          return D();
      case 'configuration':       return !isClient ? <ConfigurationModule /> : D();
      case 'users':               return !isClient ? <UserManagement /> : D();
      case 'roles':               return !isClient ? <RoleManagement /> : D();
      case 'permissions':         return D();
      case 'clients':             return !isClient ? <ClientManagement onNavigateToSales={handleNavigateToSalesWithClient as any} /> : D();
      case 'suppliers':           return !isClient ? <SupplierManagement /> : D();
      case 'supplies':            return !isClient ? <SupplyManagement /> : D();
      case 'product-categories':  return !isClient ? <ProductCategoryManagement /> : D();
      case 'sales':               return !isClient ? <SalesModule clientFilter={salesClientFilter} onClearClientFilter={() => setSalesClientFilter(null)} /> : D();
      case 'purchases':           return !isClient ? <PurchaseModule /> : D();
      case 'news':                return !isClient ? <NewsModule /> : D();
      case 'production-employees':        return !isClient ? <EmployeeManagement /> : D();
      case 'production-orders-sub':       return !isClient ? <ProductionModule /> : D();
      case 'production-technical-sheets': return !isClient ? <TechnicalSheetModule /> : D();
      case 'nomina':                       return !isClient ? <PayrollModule /> : D();
      default: return D();
    }
  };

  const getModuleTitle = (): string => {
    const titles: Record<string, string> = {
      dashboard:                      'Panel Principal',
      configuration:                  'Configuración del Sistema',
      users:                          'Gestión de Usuarios',
      roles:                          'Roles y Permisos',
      permissions:                    'Roles y Permisos',
      catalog:                        'Productos',
      clients:                        'Gestión de Clientes',
      suppliers:                      'Gestión de Proveedores',
      supplies:                       'Gestión de Insumos',
      'product-categories':           'Categorías de productos',
      purchases:                      'Módulo de Compras de insumos',
      sales:                          'Módulo de Ventas',
      news:                           'Novedades y Comunicados',
      'production-employees':         'Empleados de Producción',
      'production-orders-sub':        'Órdenes de Producción',
      'production-technical-sheets':  'Fichas Técnicas',
      nomina:                         'Control de Pagos',
      'my-purchases':                 'Mis Compras',
      'my-profile':                   'Mi Perfil',
      'client-purchases':             'Mis Compras',
      settings:                       'Ajustes de cuenta',
    };
    return titles[currentModule] ?? 'Panel Principal';
  };

  const availableModules = getAvailableModules();
  const isClient = (u.userType as string) === 'client' || isClientPreview;

  return (
    <CartProvider>
      <Toaster richColors position="top-right" />
      {showLandingPage ? (
        <LandingPage
          onGoToSystem={toggleLandingPage}
          userType={u.userType}
          currentUser={{ name: u.name, email: u.email, userType: u.userType }}
          onLogout={handleLogout}
        />
      ) : (
      <div className="min-h-screen bg-gray-100 flex relative">
        {sidebarOpen && (
          <div className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 lg:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleLandingPage}
                className="flex items-center space-x-3 hover:opacity-75 transition-opacity"
                title="Ir al Landing Page"
              >
                <div className="w-8 lg:w-10 h-8 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg lg:text-xl">J</span>
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl text-gray-900">Jrepuestos</h1>
                  <p className="text-xs lg:text-sm text-gray-500">Medellín</p>
                </div>
              </button>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-4">
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
            </div>
          </div>

          <nav className="flex-1 mt-6 px-4 pb-2 overflow-y-auto">
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

          {/* ── Footer pinned: Ajustes (perfil personal) + Ayuda ── */}
          <div className="border-t border-gray-200 px-4 py-3 flex-shrink-0 space-y-1">
            <button
              onClick={() => { setCurrentModule('settings'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                currentModule === 'settings'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserIcon size={18} />
              <span>Ajustes</span>
            </button>

            <button
              onClick={() => toast.info('¿Necesitas ayuda? Escríbenos a soporte@jrepuestos.com')}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
            >
              <HelpCircle size={18} />
              <span>Ayuda</span>
            </button>
          </div>
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
      )}
      {u.userType === 'client' && <CartDrawer />}
      {u.userType === 'client' && <CartButton />}
    </CartProvider>
  );
}

