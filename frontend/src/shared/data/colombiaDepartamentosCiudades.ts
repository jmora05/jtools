/**
 * Catálogo de Departamentos y Ciudades (municipios principales) de Colombia.
 * Fuente de verdad para el frontend web. Existe un equivalente en Dart para
 * la app móvil (movil/lib/core/colombia_departamentos_ciudades.dart) — si se
 * agrega o corrige una ciudad aquí, replicar el cambio también allá.
 */

export interface DepartamentoCiudades {
  departamento: string;
  ciudades: string[];
}

export const COLOMBIA_DEPARTAMENTOS_CIUDADES: DepartamentoCiudades[] = [
  { departamento: 'Amazonas', ciudades: ['Leticia', 'Puerto Nariño'] },
  {
    departamento: 'Antioquia',
    ciudades: [
      'Apartadó', 'Bello', 'Caldas', 'Caucasia', 'Chigorodó', 'Copacabana',
      'El Carmen de Viboral', 'Envigado', 'Girardota', 'Itagüí', 'La Estrella',
      'Marinilla', 'Medellín', 'Necoclí', 'Rionegro', 'Sabaneta',
      'Santa Fe de Antioquia', 'Turbo',
    ],
  },
  { departamento: 'Arauca', ciudades: ['Arauca', 'Arauquita', 'Saravena', 'Tame'] },
  {
    departamento: 'Atlántico',
    ciudades: ['Baranoa', 'Barranquilla', 'Galapa', 'Malambo', 'Puerto Colombia', 'Sabanalarga', 'Soledad'],
  },
  {
    departamento: 'Bogotá D.C.',
    ciudades: ['Bogotá'],
  },
  {
    departamento: 'Bolívar',
    ciudades: ['Arjona', 'Cartagena', 'El Carmen de Bolívar', 'Magangué', 'Mompós', 'Turbaco'],
  },
  {
    departamento: 'Boyacá',
    ciudades: ['Chiquinquirá', 'Duitama', 'Paipa', 'Sogamoso', 'Tunja', 'Villa de Leyva'],
  },
  {
    departamento: 'Caldas',
    ciudades: ['Anserma', 'Chinchiná', 'La Dorada', 'Manizales', 'Riosucio', 'Villamaría'],
  },
  { departamento: 'Caquetá', ciudades: ['Florencia', 'Puerto Rico', 'San Vicente del Caguán'] },
  { departamento: 'Casanare', ciudades: ['Aguazul', 'Tauramena', 'Villanueva', 'Yopal'] },
  { departamento: 'Cauca', ciudades: ['Patía', 'Popayán', 'Puerto Tejada', 'Santander de Quilichao'] },
  { departamento: 'Cesar', ciudades: ['Aguachica', 'Bosconia', 'Codazzi', 'Valledupar'] },
  { departamento: 'Chocó', ciudades: ['Istmina', 'Quibdó', 'Tadó'] },
  { departamento: 'Córdoba', ciudades: ['Cereté', 'Lorica', 'Montería', 'Sahagún', 'Tierralta'] },
  {
    departamento: 'Cundinamarca',
    ciudades: [
      'Cajicá', 'Chía', 'Facatativá', 'Funza', 'Fusagasugá', 'Girardot',
      'Madrid', 'Mosquera', 'Soacha', 'Zipaquirá',
    ],
  },
  { departamento: 'Guainía', ciudades: ['Inírida'] },
  { departamento: 'Guaviare', ciudades: ['San José del Guaviare'] },
  { departamento: 'Huila', ciudades: ['Garzón', 'La Plata', 'Neiva', 'Pitalito'] },
  { departamento: 'La Guajira', ciudades: ['Maicao', 'Manaure', 'Riohacha', 'Uribia'] },
  { departamento: 'Magdalena', ciudades: ['Ciénaga', 'El Banco', 'Fundación', 'Santa Marta'] },
  { departamento: 'Meta', ciudades: ['Acacías', 'Granada', 'Puerto López', 'Villavicencio'] },
  { departamento: 'Nariño', ciudades: ['Ipiales', 'Pasto', 'Tumaco', 'Túquerres'] },
  {
    departamento: 'Norte de Santander',
    ciudades: ['Cúcuta', 'Los Patios', 'Ocaña', 'Pamplona', 'Villa del Rosario'],
  },
  { departamento: 'Putumayo', ciudades: ['Mocoa', 'Orito', 'Puerto Asís'] },
  { departamento: 'Quindío', ciudades: ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro'] },
  {
    departamento: 'Risaralda',
    ciudades: ['Dosquebradas', 'La Virginia', 'Pereira', 'Santa Rosa de Cabal'],
  },
  { departamento: 'San Andrés y Providencia', ciudades: ['Providencia', 'San Andrés'] },
  {
    departamento: 'Santander',
    ciudades: [
      'Barrancabermeja', 'Bucaramanga', 'Floridablanca', 'Girón',
      'Piedecuesta', 'San Gil',
    ],
  },
  { departamento: 'Sucre', ciudades: ['Corozal', 'Sampués', 'Sincelejo'] },
  { departamento: 'Tolima', ciudades: ['Espinal', 'Honda', 'Ibagué', 'Melgar'] },
  {
    departamento: 'Valle del Cauca',
    ciudades: ['Buenaventura', 'Buga', 'Cali', 'Cartago', 'Jamundí', 'Palmira', 'Tuluá', 'Yumbo'],
  },
  { departamento: 'Vaupés', ciudades: ['Mitú'] },
  { departamento: 'Vichada', ciudades: ['Puerto Carreño'] },
];

export function getAllDepartamentos(): string[] {
  return COLOMBIA_DEPARTAMENTOS_CIUDADES.map(d => d.departamento);
}

export function getCiudadesByDepartamento(departamento: string): string[] {
  return COLOMBIA_DEPARTAMENTOS_CIUDADES.find(d => d.departamento === departamento)?.ciudades ?? [];
}
