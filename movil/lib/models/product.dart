// lib/models/product.dart

/// Define la estructura de un repuesto (producto) en el catálogo.
class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final String imageUrl;
  final String partNumber;
  final List<String> compatibleVehicles;
  final String category; // Para filtros

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.partNumber,
    required this.compatibleVehicles,
    required this.category,
  });
}

// Datos de ejemplo para poblar el catálogo
final List<Product> dummyProducts = [
  Product(
    id: '1',
    name: 'Filtro de Aceite Sintético',
    description: 'Filtro de alto rendimiento diseñado para aceites sintéticos, ofrece protección superior contra el desgaste.',
    price: 15.50,
    imageUrl: 'https://ejemplo.com/filtro_aceite.jpg',
    partNumber: 'FA-1001-SYN',
    compatibleVehicles: ['Toyota Corolla 2010-2020', 'Honda Civic 2012-2018'],
    category: 'Motor',
  ),
  Product(
    id: '2',
    name: 'Pastillas de Freno Cerámicas (Juego)',
    description: 'Compuesto cerámico que reduce el polvo y el ruido, manteniendo un rendimiento de frenado excepcional.',
    price: 45.99,
    imageUrl: 'https://ejemplo.com/pastillas_freno.jpg',
    partNumber: 'PF-2050-CER',
    compatibleVehicles: ['Ford Focus 2015-2021', 'Mazda 3 2014-2019'],
    category: 'Frenos',
  ),
  Product(
    id: '3',
    name: 'Amortiguador Trasero Gas',
    description: 'Amortiguador de nitrógeno presurizado para un manejo estable y cómodo en todo tipo de terreno.',
    price: 78.00,
    imageUrl: 'https://ejemplo.com/amortiguador.jpg',
    partNumber: 'AM-5012-GAS',
    compatibleVehicles: ['Nissan Sentra 2008-2016'],
    category: 'Suspensión',
  ),
];