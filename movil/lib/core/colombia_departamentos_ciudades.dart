// Catálogo de Departamentos y Ciudades (municipios principales) de Colombia.
// Equivalente Dart del catálogo web en
// frontend/src/shared/data/colombiaDepartamentosCiudades.ts — si se agrega
// o corrige una ciudad aquí, replicar el cambio también allá.

class DepartamentoCiudades {
  final String departamento;
  final List<String> ciudades;
  const DepartamentoCiudades(this.departamento, this.ciudades);
}

const List<DepartamentoCiudades> kColombiaDepartamentosCiudades = [
  DepartamentoCiudades('Amazonas', ['Leticia', 'Puerto Nariño']),
  DepartamentoCiudades('Antioquia', [
    'Apartadó', 'Bello', 'Caldas', 'Caucasia', 'Chigorodó', 'Copacabana',
    'El Carmen de Viboral', 'Envigado', 'Girardota', 'Itagüí', 'La Estrella',
    'Marinilla', 'Medellín', 'Necoclí', 'Rionegro', 'Sabaneta',
    'Santa Fe de Antioquia', 'Turbo',
  ]),
  DepartamentoCiudades('Arauca', ['Arauca', 'Arauquita', 'Saravena', 'Tame']),
  DepartamentoCiudades('Atlántico', [
    'Baranoa', 'Barranquilla', 'Galapa', 'Malambo', 'Puerto Colombia',
    'Sabanalarga', 'Soledad',
  ]),
  DepartamentoCiudades('Bogotá D.C.', ['Bogotá']),
  DepartamentoCiudades('Bolívar', [
    'Arjona', 'Cartagena', 'El Carmen de Bolívar', 'Magangué', 'Mompós', 'Turbaco',
  ]),
  DepartamentoCiudades('Boyacá', [
    'Chiquinquirá', 'Duitama', 'Paipa', 'Sogamoso', 'Tunja', 'Villa de Leyva',
  ]),
  DepartamentoCiudades('Caldas', [
    'Anserma', 'Chinchiná', 'La Dorada', 'Manizales', 'Riosucio', 'Villamaría',
  ]),
  DepartamentoCiudades('Caquetá', ['Florencia', 'Puerto Rico', 'San Vicente del Caguán']),
  DepartamentoCiudades('Casanare', ['Aguazul', 'Tauramena', 'Villanueva', 'Yopal']),
  DepartamentoCiudades('Cauca', ['Patía', 'Popayán', 'Puerto Tejada', 'Santander de Quilichao']),
  DepartamentoCiudades('Cesar', ['Aguachica', 'Bosconia', 'Codazzi', 'Valledupar']),
  DepartamentoCiudades('Chocó', ['Istmina', 'Quibdó', 'Tadó']),
  DepartamentoCiudades('Córdoba', ['Cereté', 'Lorica', 'Montería', 'Sahagún', 'Tierralta']),
  DepartamentoCiudades('Cundinamarca', [
    'Cajicá', 'Chía', 'Facatativá', 'Funza', 'Fusagasugá', 'Girardot',
    'Madrid', 'Mosquera', 'Soacha', 'Zipaquirá',
  ]),
  DepartamentoCiudades('Guainía', ['Inírida']),
  DepartamentoCiudades('Guaviare', ['San José del Guaviare']),
  DepartamentoCiudades('Huila', ['Garzón', 'La Plata', 'Neiva', 'Pitalito']),
  DepartamentoCiudades('La Guajira', ['Maicao', 'Manaure', 'Riohacha', 'Uribia']),
  DepartamentoCiudades('Magdalena', ['Ciénaga', 'El Banco', 'Fundación', 'Santa Marta']),
  DepartamentoCiudades('Meta', ['Acacías', 'Granada', 'Puerto López', 'Villavicencio']),
  DepartamentoCiudades('Nariño', ['Ipiales', 'Pasto', 'Tumaco', 'Túquerres']),
  DepartamentoCiudades('Norte de Santander', [
    'Cúcuta', 'Los Patios', 'Ocaña', 'Pamplona', 'Villa del Rosario',
  ]),
  DepartamentoCiudades('Putumayo', ['Mocoa', 'Orito', 'Puerto Asís']),
  DepartamentoCiudades('Quindío', ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro']),
  DepartamentoCiudades('Risaralda', [
    'Dosquebradas', 'La Virginia', 'Pereira', 'Santa Rosa de Cabal',
  ]),
  DepartamentoCiudades('San Andrés y Providencia', ['Providencia', 'San Andrés']),
  DepartamentoCiudades('Santander', [
    'Barrancabermeja', 'Bucaramanga', 'Floridablanca', 'Girón',
    'Piedecuesta', 'San Gil',
  ]),
  DepartamentoCiudades('Sucre', ['Corozal', 'Sampués', 'Sincelejo']),
  DepartamentoCiudades('Tolima', ['Espinal', 'Honda', 'Ibagué', 'Melgar']),
  DepartamentoCiudades('Valle del Cauca', [
    'Buenaventura', 'Buga', 'Cali', 'Cartago', 'Jamundí', 'Palmira', 'Tuluá', 'Yumbo',
  ]),
  DepartamentoCiudades('Vaupés', ['Mitú']),
  DepartamentoCiudades('Vichada', ['Puerto Carreño']),
];

List<String> todosLosDepartamentos() =>
    kColombiaDepartamentosCiudades.map((d) => d.departamento).toList();

List<String> ciudadesPorDepartamento(String departamento) {
  for (final d in kColombiaDepartamentosCiudades) {
    if (d.departamento == departamento) return d.ciudades;
  }
  return const [];
}
