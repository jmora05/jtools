// pedido_detalle_page.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'pedido_model.dart';
import 'pedido_controller.dart';

class PedidoDetallePage extends StatelessWidget {
  final Pedido pedido;

  const PedidoDetallePage({super.key, required this.pedido});

  @override
  Widget build(BuildContext context) {
    final controller = Provider.of<PedidoController>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalles del pedido'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          const Text('Información del pedido', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          _infoRow('Número del pedido', pedido.id),
          const SizedBox(height: 8),
          _infoRow('Fecha del pedido', "${pedido.fecha.day} ${_mesNombre(pedido.fecha.month)} ${pedido.fecha.year}"),
          const SizedBox(height: 8),
          _infoRow('Estado del pedido', pedido.estado),
          const SizedBox(height: 16),

          const Divider(),

          const SizedBox(height: 12),
          const Text('Productos', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          // lista de productos
          ...pedido.items.map((it) {
            return ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(it.nombre, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('Cantidad: ${it.cantidad}'),
              trailing: Text('\$${(it.precio * it.cantidad).toStringAsFixed(2)}'),
            );
          }),

          const SizedBox(height: 12),
          const Divider(),
          const SizedBox(height: 8),

          // resumen
          const Text('Resumen del pedido', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _resumenRow('Subtotal', '\$${pedido.subtotal.toStringAsFixed(2)}'),
          _resumenRow('Envío', '\$${pedido.envioCosto.toStringAsFixed(2)}'),
          const SizedBox(height: 8),
          const Divider(),
          _resumenRowBold('Total', '\$${pedido.total.toStringAsFixed(2)}'),

          const SizedBox(height: 18),
          const Divider(),
          const SizedBox(height: 12),

          const Text('Información de Envío', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(pedido.envio.direccion),
          const SizedBox(height: 6),
          Text('Método de pago: ${pedido.envio.metodoPago}'),

          const SizedBox(height: 22),

          // botones acciones: cambiar estado / cancelar
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                  onPressed: () {
                    controller.cambiarEstado(pedido, 'Enviado');
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Estado actualizado a Enviado')));
                  },
                  child: const Text('Marcar como Enviado',style: TextStyle(color: Colors.white),),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: () {
                    controller.cancelarPedido(pedido);
                    Navigator.pop(context);
                  },
                  child: const Text('Cancelar pedido',style: TextStyle(color: Colors.white),),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _resumenRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label, style: TextStyle(color: Colors.grey.shade700)), Text(value)],
      ),
    );
  }

  Widget _resumenRowBold(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label, style: const TextStyle(fontWeight: FontWeight.bold)), Text(value, style: const TextStyle(fontWeight: FontWeight.bold))],
      ),
    );
  }

  String _mesNombre(int mes) {
    const meses = [
      '',
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre'
    ];
    return meses[mes];
  }
}
