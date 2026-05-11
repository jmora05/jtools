import 'package:flutter/material.dart';
import 'pedido_model.dart';

class SeleccionarProductosPage extends StatefulWidget {
  const SeleccionarProductosPage({super.key});

  @override
  State<SeleccionarProductosPage> createState() =>
      _SeleccionarProductosPageState();
}

class _SeleccionarProductosPageState extends State<SeleccionarProductosPage> {
  // catálogo base (puedes reemplazar por fetch desde API)
  final List<PedidoItem> catalogo = [
    PedidoItem(nombre: 'Valvula pvc', precio: 12000.0),
    PedidoItem(nombre: 'Caucho pvc', precio: 10000.0),
    PedidoItem(nombre: 'Vavula metalica', precio: 7000.0),
    PedidoItem(nombre: 'Dedo selector Logan', precio: 5000.0),
  ];

  final List<PedidoItem> seleccionados = [];

  void _addOrIncrease(PedidoItem producto) {
    final idx =
        seleccionados.indexWhere((s) => s.nombre == producto.nombre);
    setState(() {
      if (idx >= 0) {
        seleccionados[idx].cantidad += 1;
      } else {
        seleccionados.add(PedidoItem(
            nombre: producto.nombre, precio: producto.precio, cantidad: 1));
      }
    });
  }

  void _decreaseOrRemove(int index) {
    setState(() {
      if (seleccionados[index].cantidad > 1) {
        seleccionados[index].cantidad -= 1;
      } else {
        seleccionados.removeAt(index);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Seleccionar productos"),
        backgroundColor: Colors.blue,
      ),
      body: Column(
        children: [
          // catálogo
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: [
                const Text('Catálogo',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...catalogo.map((p) {
                  return Card(
                    child: ListTile(
                      title: Text(p.nombre),
                      subtitle: Text('\$${p.precio.toStringAsFixed(0)}'),
                      trailing: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                        onPressed: () => _addOrIncrease(p),
                        child: const Text('Agregar', style: TextStyle(color: Colors.white)),
                      ),
                    ),
                  );
                }).toList(),
                const SizedBox(height: 12),
                const Text('Items seleccionados',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...seleccionados.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return Card(
                    child: ListTile(
                      title: Text(item.nombre),
                      subtitle:
                          Text('Precio: \$${item.precio.toStringAsFixed(0)}'),
                      leading: IconButton(
                        icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                        onPressed: () => _decreaseOrRemove(index),
                      ),
                      trailing: Text('x ${item.cantidad}'),
                    ),
                  );
                }),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Colors.blue,
        icon: const Icon(Icons.check, color: Colors.white),
        label: const Text('Registrar pedido', style: TextStyle(color: Colors.white)),
        onPressed: () {
          if (seleccionados.isEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Selecciona al menos un producto')));
            return;
          }
          // devolver la lista seleccionada al caller
          Navigator.pop(context, seleccionados);
        },
      ),
    );
  }
}
