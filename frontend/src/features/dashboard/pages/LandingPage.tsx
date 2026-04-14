import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { 
  MenuIcon,
  XIcon,
  ArrowRightIcon,
  PhoneIcon,
  MapPinIcon,
  MailIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  ShoppingCartIcon,
  UsersIcon,
  AwardIcon,
  ClockIcon,
  StarIcon,
  ChevronRightIcon
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  originalPrice?: string;
  image: string;
  description: string;
  rating: number;
  reviews: number;
}

interface LandingPageProps {
  onGoToSystem?: () => void;
  userType?: string;
}

export default function LandingPage({ onGoToSystem, userType }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Featured products data
  const featuredProducts: Product[] = [
    {
      id: 1,
      name: 'Pastillas de Freno Premium',
      category: 'Sistema de Frenos',
      price: '$89.900',
      originalPrice: '$105.000',
      image: 'https://images.unsplash.com/photo-1656597631995-9fa0e1072279?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBicmFrZSUyMHBhZHMlMjBhdXRvbW90aXZlJTIwcGFydHN8ZW58MXx8fHwxNzU2Njk5MzA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      description: 'Pastillas de freno de alta calidad para máxima seguridad y durabilidad',
      rating: 4.8,
      reviews: 127
    },
    {
      id: 2,
      name: 'Kit de Motor Completo',
      category: 'Motor',
      price: '$450.000',
      originalPrice: '$520.000',
      image: 'https://images.unsplash.com/photo-1633281256183-c0f106f70d76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBlbmdpbmUlMjBwYXJ0cyUyMG1vdG9yJTIwYXV0b21vdGl2ZXxlbnwxfHx8fDE3NTY3NTQ0Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      description: 'Kit completo de repuestos para motor con garantía extendida',
      rating: 4.9,
      reviews: 89
    },
    {
      id: 3,
      name: 'Llantas Deportivas 18"',
      category: 'Llantas y Neumáticos',
      price: '$320.000',
      image: 'https://images.unsplash.com/photo-1580053852056-f3992ab1e5e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjB0aXJlcyUyMHdoZWVscyUyMGF1dG9tb3RpdmV8ZW58MXx8fHwxNzU2NzU0NDgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      description: 'Llantas deportivas de aleación ligera para mejor rendimiento',
      rating: 4.7,
      reviews: 203
    },
    {
      id: 4,
      name: 'Amortiguadores Premium',
      category: 'Suspensión',
      price: '$180.000',
      originalPrice: '$210.000',
      image: 'https://images.unsplash.com/photo-1561338800-3aca39ac913e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBzdXNwZW5zaW9uJTIwcGFydHN8ZW58MXx8fHwxNzU2NzU0NDg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      description: 'Amortiguadores de alta gama para mejor estabilidad y confort',
      rating: 4.6,
      reviews: 156
    }
  ];

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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">J</span>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">Jrepuestos</div>
                <div className="text-sm text-gray-600">Medellín</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('catalogo')}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Catálogo
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
              {onGoToSystem ? (
                <Button 
                  onClick={onGoToSystem}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Ver Sistema
                </Button>
              ) : (
                <Button 
                  onClick={() => scrollToSection('catalogo')}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Ver Productos
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
                  Catálogo
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
                {onGoToSystem ? (
                  <Button 
                    onClick={onGoToSystem}
                    className="mx-4 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Ver Sistema
                  </Button>
                ) : (
                  <Button 
                    onClick={() => scrollToSection('catalogo')}
                    className="mx-4 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Ver Productos
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
                  ¡Calidad garantizada desde 1995!
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Repuestos de <span className="text-blue-600">Calidad</span> para tu Vehículo
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  En Jrepuestos Medellín encontrarás los mejores repuestos automotrices con la más alta calidad 
                  y los precios más competitivos del mercado. Más de 25 años de experiencia nos respaldan.
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
                  <div className="text-2xl font-bold text-blue-600">25+</div>
                  <div className="text-sm text-gray-600">Años de Experiencia</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">10K+</div>
                  <div className="text-sm text-gray-600">Clientes Satisfechos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">50K+</div>
                  <div className="text-sm text-gray-600">Productos Vendidos</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1642399299924-c9c97617bf86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbW90aXZlJTIwcGFydHMlMjB3YXJlaG91c2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzU2NzU0NDcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Jrepuestos Warehouse"
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-6 -left-6 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center space-x-2">
                  <AwardIcon className="w-6 h-6 text-orange-500" />
                  <div>
                    <div className="font-medium text-sm">Garantía Extendida</div>
                    <div className="text-xs text-gray-600">En todos los productos</div>
                  </div>
                </div>
              </div>

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
              Productos Destacados
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
              Nuestro Catálogo de Repuestos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Contamos con una amplia variedad de repuestos para todas las marcas y modelos. 
              Calidad garantizada y precios competitivos.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                <div className="relative overflow-hidden rounded-t-lg">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.originalPrice && (
                    <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
                      Oferta
                    </Badge>
                  )}
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {product.category}
                    </Badge>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      ({product.reviews} reseñas)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {product.price}
                      </div>
                      {product.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">
                          {product.originalPrice}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => toast.success('Producto agregado a la consulta. Te contactaremos pronto.')}
                  >
                    <ShoppingCartIcon className="w-4 h-4 mr-2" />
                    Ver más detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3"
              onClick={() => toast.info('Catálogo completo próximamente disponible')}
            >
              Ver Catálogo Completo
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </Button>
          </div>
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
                  Más de 25 años siendo líderes en repuestos automotrices
                </h2>
              </div>

              <div className="space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed">
                  En <strong>Jrepuestos Medellín</strong> somos una empresa familiar que desde 1995 se ha dedicado 
                  a brindar soluciones integrales en repuestos automotrices para todo tipo de vehículos. 
                  Nuestra experiencia y compromiso con la calidad nos han convertido en la opción preferida 
                  de miles de clientes en toda Antioquia.
                </p>

                <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-blue-900">Nuestra Misión</h3>
                  <p className="text-blue-800">
                    Proveer repuestos automotrices de la más alta calidad a precios justos, 
                    brindando un servicio excepcional que supere las expectativas de nuestros clientes 
                    y contribuya a la seguridad vial en nuestras carreteras.
                  </p>
                </div>

                <div className="bg-orange-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-orange-900">Nuestra Visión</h3>
                  <p className="text-orange-800">
                    Ser reconocidos como la empresa líder en distribución de repuestos automotrices 
                    en Colombia, expandiendo nuestra presencia nacional mientras mantenemos nuestros 
                    valores de calidad, confiabilidad y servicio al cliente.
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
                  src="https://images.unsplash.com/photo-1577801347179-8356c29eb6fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBhdXRvbW90aXZlJTIwdGVhbSUyMHdvcmtzaG9wfGVufDF8fHx8MTc1Njc1NDQ4NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Equipo Jrepuestos"
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Stats overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">25+</div>
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

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Envíanos un mensaje</CardTitle>
                <CardDescription>
                  Completa el formulario y te contactaremos en menos de 24 horas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nombre completo *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={contactForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Correo electrónico *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={contactForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700">
                      Mensaje *
                    </label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Cuéntanos qué repuesto necesitas o cualquier consulta que tengas..."
                      value={contactForm.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    size="lg"
                  >
                    Enviar Mensaje
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Información de contacto
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Visítanos en nuestra sede principal o comunícate con nosotros 
                  a través de cualquiera de nuestros canales de atención.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PhoneIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Teléfonos</h4>
                    <div className="space-y-1 text-gray-600">
                      <p>+57 (4) 123-4567</p>
                      <p>+57 (4) 987-6543</p>
                      <p className="text-sm">Lun - Vie: 7:00 AM - 6:00 PM</p>
                      <p className="text-sm">Sáb: 8:00 AM - 4:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Dirección</h4>
                    <div className="text-gray-600">
                      <p>Carrera 50 #25-100</p>
                      <p>Medellín, Antioquia</p>
                      <p>Colombia</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MailIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Correo electrónico</h4>
                    <div className="space-y-1 text-gray-600">
                      <p>ventas@jrepuestosmedellin.com</p>
                      <p>info@jrepuestosmedellin.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Síguenos en redes sociales</h4>
                <div className="flex space-x-4">
                  <Button variant="outline" size="sm" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                    <FacebookIcon className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" className="border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white">
                    <InstagramIcon className="w-4 h-4 mr-2" />
                    Instagram
                  </Button>
                  <Button variant="outline" size="sm" className="border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white">
                    <TwitterIcon className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">J</span>
                </div>
                <div>
                  <div className="text-xl font-bold">Jrepuestos</div>
                  <div className="text-sm text-gray-400">Medellín</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Más de 25 años brindando soluciones integrales en repuestos automotrices 
                con la más alta calidad y precios competitivos.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                  <FacebookIcon className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-pink-500 rounded-lg flex items-center justify-center transition-colors">
                  <InstagramIcon className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-lg flex items-center justify-center transition-colors">
                  <TwitterIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => scrollToSection('catalogo')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Catálogo de Productos
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
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Términos y Condiciones
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Política de Privacidad
                  </a>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-bold mb-4">Categorías</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Sistema de Frenos</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Motor</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Suspensión</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Llantas y Neumáticos</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Transmisión</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Sistema Eléctrico</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start space-x-2">
                  <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">
                    Carrera 50 #25-100<br />
                    Medellín, Antioquia
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300">+57 (4) 123-4567</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MailIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300">ventas@jrepuestosmedellin.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Jrepuestos Medellín. Todos los derechos reservados.</p>
            <p className="mt-2">Desarrollado con ❤️ para brindar la mejor experiencia a nuestros clientes.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}