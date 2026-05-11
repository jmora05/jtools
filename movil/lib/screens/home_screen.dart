// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'catalog_screen.dart';
import 'cart_screen.dart';

const Color primaryColor = Color(0xFF81D4FA); // Azul Claro Corporativo

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AutoParts Pro - Repuestos',
          style: TextStyle(
            color: primaryColor,
            fontWeight: FontWeight.w800,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0, // Interfaz limpia
        centerTitle: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            // Banner de bienvenida
            _buildWelcomeCard(context),
            
            const SizedBox(height: 30),
            
            // Botones de Navegación
            _buildNavigationButton(
              context,
              'Explorar Catálogo',
              Icons.search,
              () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CatalogScreen()),
              ),
            ),
            
            const SizedBox(height: 15),
            
            _buildNavigationButton(
              context,
              'Mi Carrito de Compras',
              Icons.shopping_cart,
              () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CartScreen()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeCard(BuildContext context) {
    return Card(
      color: primaryColor.withOpacity(0.1), // Fondo sutil
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '¡Bienvenido!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: primaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Encuentra el repuesto exacto para tu vehículo con la mayor calidad.',
              style: TextStyle(fontSize: 16, color: Colors.grey[700]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavigationButton(
      BuildContext context, String text, IconData icon, VoidCallback onPressed) {
    return SizedBox(
      height: 60,
      child: ElevatedButton.icon(
        icon: Icon(icon, size: 28),
        label: Text(text, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          foregroundColor: Colors.white,
          backgroundColor: primaryColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          elevation: 3,
        ),
      ),
    );
  }
}