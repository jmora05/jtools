import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';
import 'empleado_model.dart';
import 'empleado_provider.dart';
import 'empleado_form_page.dart';

class EmpleadoDetallePage extends StatelessWidget {
  final Empleado empleado;
  const EmpleadoDetallePage({super.key, required this.empleado});

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    return Scaffold(
      backgroundColor: kBg,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 160,
          pinned: true,
          backgroundColor: kPrimaryDark,
          foregroundColor: Colors.white,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: SafeArea(child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 40, 20, 16),
                child: Row(children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: Colors.white24,
                    child: Text(
                      empleado.nombres.isNotEmpty ? empleado.nombres[0].toUpperCase() : '?',
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(empleado.nombreCompleto,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text(empleado.cargo, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                      const SizedBox(height: 8),
                      _EstadoBadge(activo: empleado.activo),
                    ],
                  )),
                ]),
              )),
            ),
          ),
          actions: [
            if (empleado.activo)
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => EmpleadoFormPage(empleado: empleado))),
              ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (v) => _accion(context, v),
              itemBuilder: (_) => [
                if (empleado.activo)
                  const PopupMenuItem(value: 'desactivar', child: Text('Desactivar')),
                if (!empleado.activo)
                  const PopupMenuItem(value: 'reactivar', child: Text('Reactivar')),
                const PopupMenuItem(
                  value: 'eliminar',
                  child: Text('Eliminar', style: TextStyle(color: kError)),
                ),
              ],
            ),
          ],
        ),
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _seccion('Identificación', [
              _fila('Tipo documento', empleado.tipoDocumento),
              _fila('Número', empleado.numeroDocumento),
            ]),
            _seccion('Contacto', [
              _fila('Email', empleado.email, icon: Icons.email_outlined),
              _fila('Teléfono', empleado.telefono, icon: Icons.phone_outlined),
              if (empleado.ciudad?.isNotEmpty ?? false)
                _fila('Ciudad',
                  (empleado.departamento?.isNotEmpty ?? false)
                    ? '${empleado.ciudad!}, ${empleado.departamento}'
                    : empleado.ciudad!,
                  icon: Icons.location_city_outlined),
              if (empleado.direccion?.isNotEmpty ?? false)
                _fila('Dirección', empleado.direccion!, icon: Icons.home_outlined),
            ]),
            _seccion('Laboral', [
              _fila('Cargo', empleado.cargo, icon: Icons.work_outline),
              _fila('Área', empleado.area, icon: Icons.business_outlined),
              _fila('Fecha de ingreso', empleado.fechaIngreso, icon: Icons.calendar_today_outlined),
            ]),
            _salarioCard(fmt.format(empleado.salario)),
            const SizedBox(height: 80),
          ]),
        )),
      ]),
    );
  }

  Future<void> _accion(BuildContext context, String accion) async {
    final prov = context.read<EmpleadoProvider>();
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(accion == 'eliminar' ? 'Eliminar empleado' :
               accion == 'desactivar' ? 'Desactivar empleado' : 'Reactivar empleado'),
        content: Text(accion == 'eliminar'
          ? '¿Estás seguro de que deseas eliminar a ${empleado.nombreCompleto}?'
          : accion == 'desactivar'
            ? '¿Desactivar a ${empleado.nombreCompleto}?'
            : '¿Reactivar a ${empleado.nombreCompleto}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: accion == 'eliminar' ? kError : kPrimary),
            child: Text(accion == 'eliminar' ? 'Eliminar' : 'Confirmar'),
          ),
        ],
      ),
    );
    if (confirmar != true || !context.mounted) return;
    try {
      if (accion == 'eliminar') {
        await prov.eliminar(empleado.id);
      } else if (accion == 'desactivar') await prov.desactivar(empleado.id);
      else await prov.reactivar(empleado.id);
      if (context.mounted) Navigator.pop(context);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: kError));
      }
    }
  }

  Widget _seccion(String titulo, List<Widget> filas) => Card(
    margin: const EdgeInsets.only(bottom: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 1,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
        child: Text(titulo.toUpperCase(), style: kLabel),
      ),
      ...filas,
    ]),
  );

  Widget _fila(String label, String value, {IconData? icon}) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    child: Row(children: [
      if (icon != null) ...[Icon(icon, size: 16, color: kTextMuted), const SizedBox(width: 8)],
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: kLabel),
        const SizedBox(height: 2),
        Text(value.isNotEmpty ? value : '—', style: const TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w500)),
      ])),
    ]),
  );

  Widget _salarioCard(String salario) => Container(
    width: double.infinity,
    margin: const EdgeInsets.only(top: 4, bottom: 12),
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6)],
        begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('SALARIO BASE MENSUAL', style: kLabel.copyWith(color: Colors.white70, letterSpacing: 0.8)),
        const SizedBox(height: 4),
        Text(salario, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
      ]),
      const Icon(Icons.payments_outlined, color: Colors.white54, size: 36),
    ]),
  );
}

class _EstadoBadge extends StatelessWidget {
  final bool activo;
  const _EstadoBadge({required this.activo});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
    decoration: BoxDecoration(
      color: activo ? Colors.white24 : Colors.white12,
      border: Border.all(color: activo ? Colors.white54 : Colors.white24),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(activo ? 'Activo' : 'Inactivo',
      style: TextStyle(color: activo ? Colors.white : Colors.white54,
        fontSize: 12, fontWeight: FontWeight.w600)),
  );
}
