// lib/screens/product_detail_screen.dart
import 'package:flutter/material.dart';
import '../models/product.dart';

const Color primaryColor = Color(0xFF81D4FA); // Azul Claro Corporativo

class ProductDetailScreen extends StatelessWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(product.name, style: const TextStyle(color: primaryColor)),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: primaryColor),
        elevation: 1,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  // Imagen del Producto
                  Center(
                    child: Container(
                      height: 200,
                      width: double.infinity,
                      color: Colors.grey[200],
                      alignment: Alignment.center,
                      child: const Icon(Icons.build_circle, size: 80, color: primaryColor),
                    ),
                  ),
                  const SizedBox(height: 20),
                  
                  // Precio y Nombre
                  Text(
                    '\$${product.price.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: primaryColor,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    product.name,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const Divider(height: 30, color: primaryColor),
                  
                  // Detalles Técnicos
                  _buildDetailRow('No. de Parte', product.partNumber),
                  _buildDetailRow('Categoría', product.category),

                  const SizedBox(height: 20),
                  
                  // Descripción
                  const Text('Descripción', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 5),
                  Text(product.description, style: TextStyle(fontSize: 16, color: Colors.grey[700])),

                  const SizedBox(height: 20),
                  
                  // Compatibilidad
                  const Text('Compatibilidad', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 5),
                  ...product.compatibleVehicles.map((vehicle) => Padding(
                        padding: const EdgeInsets.only(left: 8.0, bottom: 4.0),
                        child: Text('- $vehicle', style: TextStyle(color: Colors.grey[600])),
                      )).toList(),
                ],
              ),
            ),
          ),
          
          // Botón fijo en la parte inferior (Docked Button)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              height: 55,
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.add_shopping_cart),
                label: const Text('Añadir al Carrito', style: TextStyle(fontSize: 18)),
                onPressed: () {
                  // Lógica para añadir al carrito
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Producto añadido al carrito!'), backgroundColor: primaryColor),
                  );
                },
                style: ElevatedButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, color: primaryColor)),
          Text(value, style: const TextStyle(fontSize: 16)),
        ],
      ),
    );
  }
}