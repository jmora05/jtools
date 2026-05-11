// pedidos_page.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'pedido_controller.dart';
import 'pedido_model.dart';
import 'pedido_detalle_page.dart';
// import 'crear_pedido_page.dart'; // cuando la tengas

class PedidosPage extends StatefulWidget {
  const PedidosPage({super.key});

  @override
  State<PedidosPage> createState() => _PedidosPageState();
}

class _PedidosPageState extends State<PedidosPage> {
  String estadoFiltro = 'Todos';
  final List<String> estados = ['Todos', 'Pendiente', 'Entregado', 'Cancelado'];

  @override
  Widget build(BuildContext context) {
    final controller = Provider.of<PedidoController>(context);
    final pedidos = controller.pedidosFiltrados(estado: estadoFiltro);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Todos los pedidos'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,

        
      ),

      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          children: [
            // FILTROS
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(child: _buildFechaDropdown()),
                const SizedBox(width: 12),
                SizedBox(width: 160, child: _buildEstadoDropdown()),
              ],
            ),

            const SizedBox(height: 18),

            // LISTA DE PEDIDOS
            Expanded(
              child: ListView.separated(
                itemCount: pedidos.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final p = pedidos[index];
                  return _pedidoCard(context, p);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ------------------------
  //     WIDGETS UI
  // ------------------------

  Widget _buildFechaDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: 'Fecha',
          items: const [
            DropdownMenuItem(value: 'Fecha', child: Text('Fecha')),
          ],
          onChanged: (_) {},
          icon: const Icon(Icons.keyboard_arrow_down),
        ),
      ),
    );
  }

  Widget _buildEstadoDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: estadoFiltro,
          items: estados
              .map(
                (e) => DropdownMenuItem(
                  value: e,
                  child: Text(e),
                ),
              )
              .toList(),
          onChanged: (v) => setState(() => estadoFiltro = v ?? 'Todos'),
          icon: const Icon(Icons.keyboard_arrow_down),
        ),
      ),
    );
  }

  Widget _pedidoCard(BuildContext context, Pedido pedido) {
    final colorEstado = _estadoColor(pedido.estado);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
          )
        ],
      ),
      child: Row(
        children: [
          // INFO
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Pedido #${pedido.id}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('-', style: TextStyle(color: Colors.grey.shade400)),
                    const SizedBox(width: 8),
                    Text(
                      pedido.estado,
                      style: TextStyle(
                        color: colorEstado,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Cliente: ${pedido.cliente}',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
                const SizedBox(height: 4),
                Text(
                  "${pedido.fecha.day} de ${_mesNombre(pedido.fecha.month)} de ${pedido.fecha.year}",
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),

          // BOTÓN VER DETALLES
          OutlinedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PedidoDetallePage(pedido: pedido),
              ),
            ),
            style: OutlinedButton.styleFrom(
              backgroundColor: Colors.blue.shade50,
              side: BorderSide(color: Colors.blue.shade100),
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
            child: const Text(
              'Ver detalles',
              style: TextStyle(color: Colors.blue),
            ),
          ),
        ],
      ),
    );
  }

  // ------------------------
  //   HELPERS
  // ------------------------

  Color _estadoColor(String estado) {
    switch (estado.toLowerCase()) {
      case 'entregado':
        return Colors.green;
      case 'pendiente':
        return Colors.orange;
      case 'cancelado':
        return Colors.red;
      default:
        return Colors.blueGrey;
    }
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
