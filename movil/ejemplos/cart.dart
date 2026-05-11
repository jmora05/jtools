import 'package:flutter/material.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: CarritoVista(),
    );
  }
}

class CarritoVista extends StatelessWidget {
  const CarritoVista({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      //definimos color del fondo de la pantalla
      backgroundColor:  Color.fromARGB(255, 245, 245, 245),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding:  EdgeInsets.all(26.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Icon(Icons.arrow_back, color: Colors.black),
                          ),
                          const Text(
                            'Carrito',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              ),
                              ),
                              ]),
                    SizedBox(height: 24),
                    // === PRODUCTO 1 ===
                    _itemCarrito(
                      imageUrl:
                          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvjx3vebg4PX1WCOOVOnQ2vG3zDuTs_TU-3Q&s',
                      nombre: 'Pastel de Chocolate',
                      cantidad: '2 unidades',
                      precio: '\$20.00',
                    ),
                    SizedBox(height: 12),

                    // === PRODUCTO 2 ===
                    _itemCarrito(
                      imageUrl:
                          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvjx3vebg4PX1WCOOVOnQ2vG3zDuTs_TU-3Q&s',
                      nombre: 'Galletas de Vainilla',
                      cantidad: '1 unidad',
                      precio: '\$5.00',
                    ),
                    SizedBox(height: 12),

                    // === PRODUCTO 3 ===
                    _itemCarrito(
                      imageUrl:
                          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvjx3vebg4PX1WCOOVOnQ2vG3zDuTs_TU-3Q&s',
                      nombre: 'Cupcakes de Fresa',
                      cantidad: '3 unidades',
                      precio: '\$15.00',
                    ),

                    SizedBox(height: 24),

                    // === RESUMEN ===
                     Text(
                      'Resumen',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),

                    _filaResumen('Subtotal', '\$40.00'),
                    _filaResumen('Envío', '\$5.00'),
                     Divider(height: 20, thickness: 1),
                    _filaResumen('Total', '\$45.00', esTotal: true),

                    SizedBox(height: 300),

                    // === BOTÓN ===
                      Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.pink,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding:  EdgeInsets.symmetric(vertical: 14),
                        alignment: Alignment.center,
                        child:  Text(
                          'Proceder al Pago',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),

          // === NAVEGACIÓN INFERIOR ===
          Container(
            decoration:  BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 4,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: BottomNavigationBar(
              type: BottomNavigationBarType.fixed,
              currentIndex: 2,
              selectedItemColor: Colors.pink,
              items:  [
                BottomNavigationBarItem(
                    icon: Icon(Icons.home), label: 'Inicio'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.menu), label: 'Menú'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.shopping_cart_outlined),
                    label: 'Carrito'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.receipt_long), label: 'Pedidos'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // === ITEM DE PRODUCTO ===
  static Widget _itemCarrito({
    required String imageUrl,
    required String nombre,
    required String cantidad,
    required String precio,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                imageUrl,
                height: 50,
                width: 50,
                fit: BoxFit.cover,
              ),
            ),
             SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  nombre,
                  style:  TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                 SizedBox(height: 4),
                Text(
                  cantidad,
                  style:  TextStyle(color: Colors.black54, fontSize: 14),
                ),
              ]),
          ]),
        Text(
          precio,
          style:  TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
      ]);
  }

  // === FILA DEL RESUMEN ===
  static Widget _filaResumen(String titulo, String valor,
      {bool esTotal = false}) {
    return Padding(
      padding:  EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            titulo,
            style: TextStyle(
              fontSize: esTotal ? 17 : 15,
              fontWeight: esTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            valor,
            style: TextStyle(
              fontSize: esTotal ? 17 : 15,
              fontWeight: esTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
