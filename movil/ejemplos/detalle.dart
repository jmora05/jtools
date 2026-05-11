import 'package:flutter/material.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor:  Color.fromARGB(255, 245, 245, 245),
        body: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Padding(
                  padding:  EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // === CABECERA ===
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Icon(Icons.arrow_back, color: Colors.black),
                          ),
                          Text(
                            'Detalles del producto',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              ),
                              ),
                              ]),

                       SizedBox(height: 24),

                      // === IMAGEN DEL PRODUCTO ===
                      ClipRRect(
                        borderRadius: BorderRadius.circular(2),
                        child: Image.network(
                          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvjx3vebg4PX1WCOOVOnQ2vG3zDuTs_TU-3Q&s',
                          height: 220,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),

                       SizedBox(height: 20),

                      // === DETALLES DEL PRODUCTO ===
                       Text(
                        'Pastel de Chocolate con Fresas',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                       SizedBox(height: 8),
                       Text(
                        'Un delicioso pastel de chocolate con una capa de crema batida y fresas frescas. Perfecto para cualquier ocasión.',
                        style: TextStyle(
                          fontSize: 15,
                          color: Colors.black87,
                          height: 1.4,
                        ),
                      ),
                       SizedBox(height: 12),
                       Text(
                        'Precio: \$25',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                       SizedBox(height: 24),

                       Text(
                        'Personalización',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                       SizedBox(height: 12),

                      // === CAMPOS DE TEXTO SIMULADOS ===
                      Text(
                          'Tamaño',
                          style: TextStyle(color: Colors.black54),
                        ),
                      Container(
                        width: double.infinity,
                        padding:  EdgeInsets.symmetric(
                            horizontal: 12, vertical: 14),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.black26),
                          borderRadius: BorderRadius.circular(8),
                          color: Colors.white,
                        ),
                      ),
                       SizedBox(height: 16),

                      Text(
                          'Sabor',
                          style: TextStyle(color: Colors.black54),
                        ),
                      Container(
                        width: double.infinity,
                        padding:  EdgeInsets.symmetric(
                            horizontal: 12, vertical: 14),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.black26),
                          borderRadius: BorderRadius.circular(8),
                          color: Colors.white,
                        ),
                      ),

                       SizedBox(height: 24),

                      // === BOTÓN SIMULADO ===
                      Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.pink,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding:  EdgeInsets.symmetric(vertical: 14),
                        alignment: Alignment.center,
                        child:  Text(
                          'Añadir al carrito',
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
                      color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))
                ],
              ),
              child: BottomNavigationBar(
                onTap: null, // sin funcionalidad
                type: BottomNavigationBarType.fixed,
                currentIndex: 1,
                selectedItemColor: Colors.pink,
                unselectedItemColor: Colors.black54,
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
      ),
    );
  }
}
