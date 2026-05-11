// lib/models/cart_item.dart
import 'product.dart';

/// Representa un item específico dentro del carrito de compras.
class CartItem {
  final Product product;
  int quantity;

  CartItem({
    required this.product,
    this.quantity = 1,
  });

  /// Calcula el subtotal multiplicando el precio del producto por la cantidad.
  double get subtotal => product.price * quantity;
}