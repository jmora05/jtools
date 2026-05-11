import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'pedidos/pedido_controller.dart';
import 'pedidos/pedidos_page.dart';

// Importa tus módulos existentes
import 'clientes/client_controller.dart';
import 'clientes/client_list_page.dart';

import 'screens/recuperar.dart';

// =========================================================
// MÓDULOS DEL CATÁLOGO DE REPUESTOS (Nuevas Importaciones)
// =========================================================
import 'screens/home_screen.dart'; // Tu nueva pantalla de inicio de repuestos
import 'screens/catalog_screen.dart';
import 'screens/cart_screen.dart';
// Note: product.dart y product_detail_screen.dart no necesitan importarse aquí
// ya que solo se llaman desde otras screens.

// Define un controlador de estado simple para el carrito (opcional, pero buena práctica)
// Si no quieres crear un archivo aparte, puedes usar este placeholder:
class CartController with ChangeNotifier {
  // Aquí iría la lógica de añadir/eliminar productos del carrito
  int get itemCount => 0; // Ejemplo
}

// Color corporativo de repuestos (Azul Claro)
const Color primaryColorParts = Color(0xFF81D4FA);


void main() {
  runApp(
    MultiProvider(
      providers: [
        // Proveedores existentes
        ChangeNotifierProvider(create: (_) => ClientController()),
        ChangeNotifierProvider(create: (_) => PedidoController()),
        // Nuevo Proveedor para el Carrito/Catálogo
        ChangeNotifierProvider(create: (_) => CartController()), 
      ],
      child: const MainApp(),
    ),
  );
}

class MainApp extends StatefulWidget {
  const MainApp({super.key});

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  // Ajustamos el índice si la vista del catálogo es la que quieres por defecto
  int currentIndex = 0; 
  
  // Puedes usar 0 para 'Inicio' (la vista de dulces) o 1 para 'Catálogo' (si ese es el foco)

  @override
  Widget build(BuildContext context) {
    // Definimos las páginas, reemplazando tus placeholders con las pantallas reales.
    final pages = [
      _homeView(), // Tu pantalla original
      _placeholder("Menú"),
      _placeholder("Carrito"),
      PedidosPage(), // Módulo de Pedidos
      ClientListPage(), // Vista de clientes funcionando
      // 0. Pestaña de 'Inicio' (Tu vista original de 'Dulce Delicia' - No repuestos)
      _homeView(), 
      
      // 1. Pestaña 'Menú' -> Ahora será el Catálogo de Repuestos
      const CatalogScreen(),
      
      // 2. Pestaña 'Carrito' -> Ahora será la Pantalla de Carrito de Repuestos
      const CartScreen(),
      
      // 3. Pestaña 'Pedidos'
      _placeholder("Pedidos"),
    ];

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      // Aplicamos el tema general aquí. Puedes usar el color de dulces (pink) o el de repuestos (blue)
      theme: ThemeData(
        primaryColor: Colors.pink, // Mantenemos el color rosa para la app general
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 1,
        ),
      ),
      home: Scaffold(
        backgroundColor: const Color.fromARGB(255, 245, 245, 245),
        appBar: AppBar(
          title: Text(
            // Título dinámico basado en la pestaña
            _getAppTitle(currentIndex),
            style: TextStyle(
              color: currentIndex == 0 ? Colors.black : primaryColorParts,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),

        body: pages[currentIndex],

        // Navegación inferior
        bottomNavigationBar: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: currentIndex,
          selectedItemColor: Colors.pink, // Color seleccionado de dulces
          unselectedItemColor: Colors.black54,
          onTap: (i) => setState(() => currentIndex = i),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.cake), label: 'Dulces'), // Cambié el icono
            BottomNavigationBarItem(icon: Icon(Icons.car_repair), label: 'Repuestos'), // Catálogo
            BottomNavigationBarItem(
                icon: Icon(Icons.shopping_cart_outlined), label: 'Carrito'), // Carrito
            BottomNavigationBarItem(
                icon: Icon(Icons.receipt_long), label: 'Pedidos'),
            BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Clientes'),
          ],
        ),
      ),
    );
  }
  
  // Función para título dinámico
  String _getAppTitle(int index) {
    switch (index) {
      case 0:
        return 'Dulce Delicia';
      case 1:
        return 'Catálogo de Repuestos';
      case 2:
        return 'Mi Carrito';
      case 3:
        return 'Historial de Pedidos';
      case 4:
        return 'Gestión de Clientes';
      default:
        return 'Jtools app';
    }
  }

  // =======================================================================
  // === 1. TU PANTALLA ORIGINAL DE INICIO (DULCES) ========================
  // =======================================================================

  Widget _homeView() {
    // Nota: Mantuve el código original de tu _homeView aquí.
    // Si quieres un enfoque más limpio, idealmente crearías un archivo
    // 'screens/sweets_home_screen.dart' y lo importarías, como hicimos con los repuestos.
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Eliminamos la cabecera ya que ahora el AppBar lo maneja.
                  const Text(
                    'Categorías de Dulces',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 16),

                  // === CARD 1 ===
                  buildCard(
                    imageUrl:
                        'https://www.recetasnestle.com.co/sites/default/files/styles/recipe_detail_desktop_new/public/srh_recipes/8b80d005d2b35d7a583470e3f19c9c1f.jpeg?itok=7TbncD74',
                    title: 'Pasteles',
                    description: 'Celebra con nuestros exquisitos pasteles',
                    price: '12000 ',
                  ),
                  const SizedBox(height: 16),

                  // === CARD 2 ===
                  buildCard(
                    imageUrl:
                        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvjx3vebg4PX1WCOOVOnQ2vG3zDuTs_TU-3Q&s',
                    title: 'Galletas',
                    description: 'Disfruta de nuestras deliciosas galletas',
                    price: '10000',
                  ),
                  const SizedBox(height: 16),

                  // === CARD 3 ===
                  buildCard(
                    imageUrl:
                        'https://images.ctfassets.net/naglem4vigsd/3ghnulN27uzMoUucb6Bhrw/25e6313d2060e0847c1aa677d6243344/easy_flan2_0-en-us?fm=webp&w=3840',
                    title: 'Postres Individuales',
                    description: 'Prueba nuestros postres individuales',
                    price: '7000',
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // =======================================================================
  // === COMPARTIDO PARA TARJETAS (DULCES) =================================
  // =======================================================================

  static Widget buildCard({
    required String imageUrl,
    required String title,
    required String description,
    required String price,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white, // Fondo blanco para la tarjeta
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.grey.withOpacity(0.1), blurRadius: 6, offset: const Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Image.network(
              imageUrl,
              height: 160,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(15),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        description,
                        style: const TextStyle(color: Colors.black54),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                // Botón de Ver Más
                Container(
                  decoration: BoxDecoration(
                    color: Colors.pink,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                  child: const Text(
                    'Ver más',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }


  // =======================================================================
  // === PLACEHOLDER (Para pantallas no implementadas) ======================
  // =======================================================================

  Widget _placeholder(String text) {
    return Center(
      child: Text(
        'Página de $text en desarrollo...',
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
      ),
    );
  }
}