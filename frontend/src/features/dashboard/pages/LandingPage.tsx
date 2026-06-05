import React, { useState, useEffect } from 'react';
import maquinaImg from '@/assets/imagenes/maquina.jpeg';
import logoImg from '@/assets/imagenes/logo.jpeg';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';
import { getApiBaseUrl } from '@/services/http';
import {
  MenuIcon,
  XIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  MailIcon,
  ShoppingCartIcon,
  UsersIcon,
  AwardIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Loader2Icon,
  TagIcon,
  LogOutIcon,
  UserIcon,
} from 'lucide-react';

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const CATEGORY_COLORS = [
  { bg: 'bg-blue-50',   border: 'border-blue-200',   iconBg: 'bg-blue-100',   icon: 'text-blue-600',   count: 'text-blue-500'   },
  { bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100', icon: 'text-orange-600', count: 'text-orange-500' },
  { bg: 'bg-green-50',  border: 'border-green-200',  iconBg: 'bg-green-100',  icon: 'text-green-600',  count: 'text-green-500'  },
  { bg: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-100', icon: 'text-purple-600', count: 'text-purple-500' },
  { bg: 'bg-red-50',    border: 'border-red-200',    iconBg: 'bg-red-100',    icon: 'text-red-600',    count: 'text-red-500'    },
  { bg: 'bg-teal-50',   border: 'border-teal-200',   iconBg: 'bg-teal-100',   icon: 'text-teal-600',   count: 'text-teal-500'   },
];

interface Producto {
  id: number;
  nombreProducto: string;
  descripcion?: string;
  precio: number;
  imagenUrl?: string;
  estado: string;
  categoria?: { nombreCategoria: string };
}

interface Categoria {
  id: number;
  nombreCategoria: string;
  descripcion?: string;
  estado?: string;
}

interface CurrentUser {
  name: string;
  email: string;
  userType: string;
}

interface LandingPageProps {
  onGoToSystem?: () => void;
  userType?: string;
  currentUser?: CurrentUser;
  onLogout?: () => void;
}

export default function LandingPage({ onGoToSystem, userType, currentUser, onLogout }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen]             = useState(false);
  const [products, setProducts]                 = useState<Producto[]>([]);
  const [categories, setCategories]             = useState<Categoria[]>([]);
  const [loadingProducts, setLoadingProducts]   = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    const base = getApiBaseUrl();

    fetch(`${base}/public/categorias`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data.filter((c: Categoria) => !c.estado || c.estado === 'activo'));
        }
      })
      .catch(() => {});

    fetch(`${base}/public/productos`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const activos = Array.isArray(data)
          ? data.filter((p: Producto) => p.estado === 'activo')
          : [];
        setProducts(activos);
        setCategories(prev => {
          if (prev.length > 0) return prev;
          const seen = new Set<string>();
          const derived: Categoria[] = [];
          activos.forEach((p: Producto) => {
            const name = p.categoria?.nombreCategoria;
            if (name && !seen.has(name)) {
              seen.add(name);
              derived.push({ id: derived.length + 1, nombreCategoria: name });
            }
          });
          return derived;
        });
      })
      .catch(err => {
        console.error('Landing productos error:', err.message);
        setProducts([]);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Por favor, completa todos los campos');
      return;
    }
    
    // Simulate form submission
    toast.success('¡Mensaje enviado correctamente! Te contactaremos pronto.');
    setContactForm({ name: '', email: '', message: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">J</span>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">Jrepuestos</div>
                <div className="text-sm text-gray-600">Medellín</div>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('catalogo')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Categorías
              </button>
              <button
                onClick={() => scrollToSection('nosotros')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Acércate a nosotros
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Contacto
              </button>
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{currentUser.name}</span>
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 font-normal">{currentUser.email}</p>
                        <Badge className={`text-xs mt-1 ${currentUser.userType === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {currentUser.userType === 'admin' ? 'Administrador' : 'Cliente'}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onGoToSystem && (
                      <DropdownMenuItem onClick={onGoToSystem} className="cursor-pointer">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Ver Sistema
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOutIcon className="w-4 h-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={onGoToSystem ?? (() => scrollToSection('catalogo'))}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Iniciar Sesión
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 bg-white">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => scrollToSection('catalogo')}
                  className="text-left px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  Categorías
                </button>
                <button
                  onClick={() => scrollToSection('nosotros')}
                  className="text-left px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  Acércate a nosotros
                </button>
                <button
                  onClick={() => scrollToSection('contacto')}
                  className="text-left px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  Contacto
                </button>
                {currentUser ? (
                  <div className="mx-4 border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{currentUser.name}</p>
                        <p className="text-xs text-gray-500">{currentUser.email}</p>
                      </div>
                    </div>
                    {onGoToSystem && (
                      <Button onClick={onGoToSystem} variant="outline" className="w-full text-sm">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Ver Sistema
                      </Button>
                    )}
                    <Button onClick={onLogout} variant="outline" className="w-full text-sm text-red-600 border-red-200 hover:bg-red-50">
                      <LogOutIcon className="w-4 h-4 mr-2" />
                      Cerrar sesión
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={onGoToSystem ?? (() => scrollToSection('catalogo'))}
                    className="mx-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Iniciar Sesión
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 lg:pt-24 bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  ¡Calidad garantizada!
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Repuestos de <span className="text-blue-600">Calidad</span> para tu Vehículo
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  En Jrepuestos Medellín encontrarás los mejores repuestos automotrices con la más alta calidad 
                  y los precios más competitivos del mercado. Más de 5 años de experiencia nos respaldan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => scrollToSection('catalogo')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                >
                  Ver Catálogo Completo
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  onClick={() => scrollToSection('contacto')}
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 px-8 py-4 text-lg"
                >
                  Contactar Asesor
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">5</div>
                  <div className="text-sm text-gray-600">Años de Experiencia</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">10K</div>
                  <div className="text-sm text-gray-600">Clientes Satisfechos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">20K+</div>
                  <div className="text-sm text-gray-600">Productos Vendidos</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src={logoImg}
                  alt="Jrepuestos Warehouse"
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating Cards */}
              

              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="font-medium text-sm">Entrega Rápida</div>
                    <div className="text-xs text-gray-600">24-48 horas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalogo" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {selectedCategory ? selectedCategory : 'Categorías'}
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
              {selectedCategory ? `Productos en "${selectedCategory}"` : 'Nuestras Categorías'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {selectedCategory
                ? `Mostrando los productos disponibles en esta categoría.`
                : 'Explora nuestras categorías y encuentra el repuesto que necesitas.'}
            </p>
          </div>

          {selectedCategory && (
            <div className="mb-8">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory(null)}
                className="border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Ver todas las categorías
              </Button>
            </div>
          )}

          {loadingProducts ? (
            <div className="flex justify-center py-16">
              <Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !selectedCategory ? (
            categories.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                No hay categorías disponibles en este momento.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat, idx) => {
                  const colors = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  const count = products.filter(p => p.categoria?.nombreCategoria === cat.nombreCategoria).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.nombreCategoria)}
                      className={`group text-left ${colors.bg} border-2 ${colors.border} rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                    >
                      <div className="space-y-4">
                        <div className={`w-14 h-14 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
                          <TagIcon className={`w-7 h-7 ${colors.icon}`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {cat.nombreCategoria}
                          </h3>
                          <p className={`text-sm mt-1 ${colors.count}`}>
                            {count} producto{count !== 1 ? 's' : ''} disponible{count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center text-sm font-medium text-blue-600">
                          Ver productos
                          <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            products.filter(p => p.categoria?.nombreCategoria === selectedCategory).length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                No hay productos disponibles en esta categoría.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.filter(p => p.categoria?.nombreCategoria === selectedCategory).map((product) => (
                  <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <ImageWithFallback
                        src={product.imagenUrl || ''}
                        alt={product.nombreProducto}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Badge variant="outline" className="text-xs mb-2">
                          {product.categoria?.nombreCategoria ?? 'Sin categoría'}
                        </Badge>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          {product.nombreProducto}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {product.descripcion || '—'}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${Number(product.precio).toLocaleString('es-CO')}
                      </div>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          if (!userType) {
                            toast.error('Debes iniciar sesión para agregar productos al carrito.', {
                              action: { label: 'Iniciar sesión', onClick: () => onGoToSystem?.() },
                            });
                            return;
                          }
                          toast.success('Te contactaremos pronto para más detalles.');
                        }}
                      >
                        <ShoppingCartIcon className="w-4 h-4 mr-2" />
                        Agregar al Carrito
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {!selectedCategory && (
            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3"
                onClick={onGoToSystem ?? (() => scrollToSection('catalogo'))}
              >
                Ver Catálogo Completo
                <ChevronRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
                  Acércate a nosotros
                </Badge>
                <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Más de 5 años siendo líderes en repuestos automotrices
                </h2>
              </div>

              <div className="space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed">
                  En <strong>Jrepuestos Medellín</strong> J Repuestos Medellín es una empresa colombiana en
                  formación, dedicada a la fabricación y comercialización de repuestos para vehículos, 
                  con un firme compromiso por la calidad, el servicio y la innovación en el sector automotor.<br/>

                  Somos una familia que cree en el poder del esfuerzo colectivo, la dedicación y la pasión por lo
                  que hacemos. <br/>

                  En J Repuestos Medellín, diseñamos y fabricamos repuestos con altos estándares de calidad,
                  buscando siempre ofrecer soluciones duraderas y confiables a nuestros clientes.
                  Nos inspira el deseo de crecer, aprender y aportar al desarrollo del sector automotriz en 
                  Colombia, especialmente en nuestra ciudad, Medellín. <br/>

                  Seguimos en proceso de consolidación, pero con metas claras: construir una marca sólida,
                  generar empleo local y ser reconocidos por nuestra seriedad, compromiso
                  y productos de excelente desempeño.<br/>

                  J Repuestos Medellín: una empresa con alma familiar y visión de futuro.
                </p>

                <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-blue-900">Nuestra Misión</h3>
                  <p className="text-blue-800">
                    Somos una microempresa familiar dedicada a la fabricación de productos y repuestos
                    para vehículos, comprometidos con ofrecer calidad, confianza y buen servicio a nuestros clientes.
                    Trabajamos con responsabilidad y dedicación para brindar soluciones eficientes que contribuyan
                    al buen funcionamiento y mantenimiento de los automóviles, apoyándonos en la experiencia adquirida
                    durante nuestros primeros años en el mercado.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-orange-900">Nuestra Visión</h3>
                  <p className="text-orange-800">
                    Ser una empresa reconocida a nivel regional por la calidad de nuestros repuestos, el compromiso
                    con nuestros clientes y el crecimiento constante de nuestro negocio familiar.
                    Buscamos seguir innovando y fortaleciendo nuestros procesos para expandirnos en el sector automotriz y convertirnos en una opción confiable y competitiva en los próximos años
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="font-bold text-gray-900">Equipo Experto</div>
                      <div className="text-sm text-gray-600">Asesoría especializada</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AwardIcon className="w-8 h-8 text-orange-500" />
                    <div>
                      <div className="font-bold text-gray-900">Calidad Premium</div>
                      <div className="text-sm text-gray-600">Marcas reconocidas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src={maquinaImg}
                  alt="Equipo Jrepuestos"
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Stats overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">5+</div>
                    <div className="text-xs text-gray-600">Años</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-500">10K+</div>
                    <div className="text-xs text-gray-600">Clientes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">99%</div>
                    <div className="text-xs text-gray-600">Satisfacción</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              Contáctanos
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
              ¿Tienes alguna consulta?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nuestro equipo de expertos está listo para ayudarte a encontrar 
              el repuesto perfecto para tu vehículo.
            </p>
          </div>

          {/* Contact Information - horizontal layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Teléfonos / WhatsApp */}
            <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <PhoneIcon className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">Teléfonos</h4>
              <div className="space-y-2 text-gray-600">
                <a
                  href="https://wa.me/573044470797"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 hover:text-green-600 transition-colors font-medium"
                >
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  +57 3044470797
                </a>
                <a
                  href="https://wa.me/573008287819"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 hover:text-green-600 transition-colors font-medium"
                >
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  +57 3008287819
                </a>
                <p className="text-sm text-gray-400 mt-2">Lun - Vie: 7:00 AM - 6:00 PM</p>
              </div>
            </div>

            {/* Dirección */}
            <a
              href="https://www.google.com/maps/search/?api=1&query=Carrera+70a+%2394-18%2C+Medell%C3%ADn%2C+Antioquia%2C+Colombia"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <MapPinIcon className="w-7 h-7 text-orange-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">Dirección</h4>
              <div className="text-gray-600">
                <p>Carrera 70a #94-18</p>
                <p>Medellín, Antioquia</p>
                <p>Colombia</p>
              </div>
            </a>

            {/* Correo */}
            <a
              href="https://mail.google.com/mail/?view=cm&to=jrepuestosmed@hotmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <MailIcon className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">Correo electrónico</h4>
              <div className="space-y-1 text-gray-600">
                <p>jrepuestosmed@hotmail.com</p>
              </div>
            </a>
          </div>

          
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Company Info */}
            <div className="space-y-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center space-x-3 hover:opacity-75 transition-opacity"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">J</span>
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold">Jrepuestos</div>
                  <div className="text-sm text-gray-400">Medellín</div>
                </div>
              </button>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Enlaces Rápidos</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={() => scrollToSection('catalogo')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Categorías
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('nosotros')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Acércate a nosotros
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('contacto')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contacto
                  </button>
                </li>
              </ul>
            </div>

            {/* Dynamic Categories */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Categorías</h4>
              {categories.length === 0 ? (
                <p className="text-gray-400 text-sm">Cargando categorías...</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {categories.slice(0, 6).map(cat => (
                    <li key={cat.id}>
                      <button
                        onClick={() => { setSelectedCategory(cat.nombreCategoria); scrollToSection('catalogo'); }}
                        className="text-gray-300 hover:text-white transition-colors text-left"
                      >
                        {cat.nombreCategoria}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Social Media — vertical, beside categories */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Síguenos</h4>
              <div className="flex flex-col space-y-3">
                <button className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                  <FacebookIcon className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-pink-500 rounded-lg flex items-center justify-center transition-colors">
                  <InstagramIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-12 text-center text-sm text-gray-400">
            <p>&copy; 2026 Jrepuestos Medellín. Todos los derechos reservados.</p>
            <p className="mt-2">Desarrollado con ❤️ para brindar la mejor experiencia a nuestros clientes.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}