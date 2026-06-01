import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'empleado_provider.dart';
import 'empleado_model.dart';
import 'empleado_detalle_page.dart';
import 'empleado_form_page.dart';

class EmpleadosPage extends StatefulWidget {
  const EmpleadosPage({super.key});
  @override State<EmpleadosPage> createState() => _EmpleadosPageState();
}

class _EmpleadosPageState extends State<EmpleadosPage> {
  String _q = '';
  String _filtroEstado = 'todos';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EmpleadoProvider>().cargar();
    });
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<EmpleadoProvider>();
    final lista = prov.empleados.where((e) {
      final matchQ = e.nombreCompleto.toLowerCase().contains(_q.toLowerCase()) ||
          e.numeroDocumento.contains(_q) ||
          e.cargo.toLowerCase().contains(_q.toLowerCase());
      final matchE = _filtroEstado == 'todos' ||
          (_filtroEstado == 'activo' && e.activo) ||
          (_filtroEstado == 'inactivo' && !e.activo);
      return matchQ && matchE;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark,
        foregroundColor: Colors.white,
        title: const Text('Empleados', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar),
        ],
      ),
      body: Column(children: [
        // ── Buscador + filtro ──────────────────────────────────────────────
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(children: [
            TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: kInputDeco('Buscar empleado...', prefix: const Icon(Icons.search, color: kTextMuted)),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['todos', 'activo', 'inactivo'].map((f) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f[0].toUpperCase() + f.substring(1)),
                    selected: _filtroEstado == f,
                    selectedColor: kChipBg,
                    labelStyle: TextStyle(
                      color: _filtroEstado == f ? kPrimaryDark : kTextMuted,
                      fontWeight: _filtroEstado == f ? FontWeight.w700 : FontWeight.normal,
                    ),
                    onSelected: (_) => setState(() => _filtroEstado = f),
                  ),
                )).toList(),
              ),
            ),
          ]),
        ),
        // ── Contenido ──────────────────────────────────────────────────────
        Expanded(child: prov.loading
          ? const Center(child: CircularProgressIndicator(color: kPrimary))
          : prov.error != null
            ? _errorView(prov)
            : lista.isEmpty
              ? _emptyView()
              : RefreshIndicator(
                  color: kPrimary,
                  onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (_, i) => _EmpleadoCard(e: lista[i]),
                  ),
                ),
        ),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kPrimary,
        icon: const Icon(Icons.person_add, color: Colors.white),
        label: const Text('Nuevo', style: TextStyle(color: Colors.white)),
        onPressed: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => const EmpleadoFormPage())),
      ),
    );
  }

  Widget _errorView(EmpleadoProvider p) => Center(child: Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      const Icon(Icons.error_outline, color: kError, size: 48),
      const SizedBox(height: 12),
      Text(p.error!, textAlign: TextAlign.center, style: const TextStyle(color: kError)),
      const SizedBox(height: 16),
      ElevatedButton(onPressed: p.cargar, child: const Text('Reintentar')),
    ],
  ));

  Widget _emptyView() => const Center(child: Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(Icons.people_outline, size: 64, color: kBorder),
      SizedBox(height: 12),
      Text('No hay empleados', style: TextStyle(color: kTextMuted, fontSize: 16)),
    ],
  ));
}

class _EmpleadoCard extends StatelessWidget {
  final Empleado e;
  const _EmpleadoCard({required this.e});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: e.activo ? kChipBg : Colors.grey.shade200,
          child: Text(
            e.nombres.isNotEmpty ? e.nombres[0].toUpperCase() : '?',
            style: TextStyle(color: e.activo ? kPrimaryDark : Colors.grey, fontWeight: FontWeight.w700),
          ),
        ),
        title: Text(e.nombreCompleto, style: const TextStyle(fontWeight: FontWeight.w600, color: kText)),
        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SizedBox(height: 2),
          Text(e.cargo, style: const TextStyle(color: kTextMuted, fontSize: 13)),
          const SizedBox(height: 4),
          Row(children: [
            _chip(e.activo ? 'Activo' : 'Inactivo', e.activo ? kPrimary : Colors.grey),
            const SizedBox(width: 6),
            _chip(e.area, kPrimaryLight),
          ]),
        ]),
        trailing: const Icon(Icons.chevron_right, color: kTextMuted),
        onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => EmpleadoDetallePage(empleado: e))),
      ),
    );
  }

  Widget _chip(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color: color.withOpacity(0.12),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withOpacity(0.4)),
    ),
    child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
  );
}
