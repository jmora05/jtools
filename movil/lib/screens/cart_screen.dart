// lib/screens/cart_screen.dart
import 'package:flutter/material.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

const Color primaryColor = Color(0xFF81D4FA); // Azul Claro Corporativo

// Simulación de datos de carrito
final List<CartItem> dummyCartItems = [
  CartItem(product: dummyProducts[0], quantity: 2),
  CartItem(product: dummyProducts[1], quantity: 1),
];

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  double _calculateTotal() {
    return dummyCartItems.fold(0.0, (sum, item) => sum + item.subtotal);
  }

  @override
  Widget build(BuildContext context) {
    final total = _calculateTotal();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Carrito', style: TextStyle(color: primaryColor)),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: primaryColor),
        elevation: 1,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: dummyCartItems.length,
              itemBuilder: (context, index) {
                return CartProductTile(item: dummyCartItems[index]);
              },
            ),
          ),
          
          // Resumen del Pedido
          _buildOrderSummary(total),

          // Botón de Pagar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              height: 55,
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.payment),
                label: Text('Finalizar Pedido (\$${total.toStringAsFixed(2)})', style: const TextStyle(fontSize: 18)),
                onPressed: total == 0 ? null : () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Procesando pago...'), backgroundColor: primaryColor),
                  );
                },
                style: ElevatedButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: primaryColor,
                  disabledBackgroundColor: primaryColor.withOpacity(0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderSummary(double total) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Resumen del Pedido', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: primaryColor)),
              const Divider(),
              _buildSummaryRow('Subtotal', total / 1.15), // Ejemplo simple de impuestos
              _buildSummaryRow('IVA (15%)', (total / 1.15) * 0.15),
              const Divider(),
              _buildSummaryRow('Total a Pagar', total, isTotal: true),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, double amount, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 18 : 16,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? primaryColor : Colors.black,
            ),
          ),
          Text(
            '\$${amount.toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: isTotal ? 18 : 16,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? primaryColor : Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}

class CartProductTile extends StatelessWidget {
  final CartItem item;
  const CartProductTile({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: ListTile(
        leading: const Icon(Icons.car_repair, size: 40, color: primaryColor), // Imagen
        title: Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('Precio unitario: \$${item.product.price.toStringAsFixed(2)}'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Cant: ${item.quantity}', style: const TextStyle(fontSize: 14)),
            Text(
              '\$${item.subtotal.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.bold, color: primaryColor),
            ),
          ],
        ),
        onTap: () {
          // Navegar a detalles del producto si se desea
        },
      ),
    );
  }
}