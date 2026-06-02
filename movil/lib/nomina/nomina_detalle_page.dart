import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'nomina_model.dart';
import 'nomina_provider.dart';

class NominaDetallePage extends StatelessWidget {
  final Nomina nomina;
  const NominaDetallePage({super.key, required this.nomina});

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);
    final salDiario = nomina.salarioBase / 30;
    final salProporcional = salDiario * nomina.diasTrabajados;

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
                padding: const EdgeInsets.fromLTRB(20, 36, 20, 16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Expanded(child: Text(nomina.nombreEmpleado ?? 'Empleado #${nomina.empleadoId}',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white))),
                    _badge(nomina.pagado),
                  ]),
                  const SizedBox(height: 4),
                  Text(nomina.cargoEmpleado ?? '', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 6),
                  Text('Período: ${nomina.fechaInicioPeriodo} – ${nomina.fechaFinPeriodo}',
                    style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ]),
              )),
            ),
          ),
          actions: [
            if (!nomina.pagado)
              TextButton.icon(
                icon: const Icon(Icons.check_circle_outline, color: Colors.white),
                label: const Text('Marcar pagado', style: TextStyle(color: Colors.white)),
                onPressed: () => _marcarPagado(context),
              ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: Colors.white),
              onSelected: (v) => _accion(context, v),
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'eliminar',
                  child: Text('Eliminar registro', style: TextStyle(color: kError)),
                ),
              ],
            ),
          ],
        ),
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _seccion('Empleado', [
              _fila('Nombre', nomina.nombreEmpleado ?? '—', icon: Icons.person_outline),
              if (nomina.documentoEmpleado != null)
                _fila('Documento', nomina.documentoEmpleado!, icon: Icons.badge_outlined),
              _fila('Cargo', nomina.cargoEmpleado ?? '—', icon: Icons.work_outline),
            ]),
            _seccion('Período', [
              _fila('Inicio', nomina.fechaInicioPeriodo, icon: Icons.calendar_today_outlined),
              _fila('Fin', nomina.fechaFinPeriodo, icon: Icons.calendar_today_outlined),
              _fila('Días trabajados', '${nomina.diasTrabajados} días', icon: Icons.access_time_outlined),
              _fila('Fecha de pago', nomina.fechaPago, icon: Icons.payment_outlined),
            ]),
            _seccion('Devengados', [
              _filaMoneda('Salario base', fmt.format(nomina.salarioBase), fmt),
              _filaMoneda('Salario proporcional (${nomina.diasTrabajados}d)', fmt.format(salProporcional), fmt),
              if (nomina.auxilioTransporte > 0)
                _filaMoneda('Auxilio de transporte', fmt.format(nomina.auxilioTransporte), fmt),
            ]),
            _netoCard(fmt),
            if (!nomina.pagado) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity, height: 50,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Marcar como pagado', style: TextStyle(fontSize: 15)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary, foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () => _marcarPagado(context),
                ),
              ),
            ],
            const SizedBox(height: 60),
          ]),
        )),
      ]),
    );
  }

  Widget _badge(bool pagado) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: Colors.white24, border: Border.all(color: Colors.white54),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(pagado ? 'Pagado' : 'Pendiente',
      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
  );

  Widget _netoCard(NumberFormat fmt) => Container(
    width: double.infinity, margin: const EdgeInsets.only(top: 4, bottom: 12),
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6)],
        begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('NETO A PAGAR', style: kLabel.copyWith(color: Colors.white70, letterSpacing: 0.8)),
        const SizedBox(height: 4),
        Text(fmt.format(nomina.pagoNeto),
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
      ]),
      const Icon(Icons.account_balance_wallet_outlined, color: Colors.white54, size: 36),
    ]),
  );

  Widget _seccion(String titulo, List<Widget> filas) => Card(
    margin: const EdgeInsets.only(bottom: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 1,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
        child: Text(titulo.toUpperCase(), style: kLabel)),
      ...filas,
    ]),
  );

  Widget _fila(String label, String value, {IconData? icon}) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    child: Row(children: [
      if (icon != null) ...[Icon(icon, size: 16, color: kTextMuted), const SizedBox(width: 8)],
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: kLabel),
        Text(value.isNotEmpty ? value : '—',
          style: const TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w500)),
      ])),
    ]),
  );

  Widget _filaMoneda(String label, String value, NumberFormat fmt) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Expanded(child: Text(label, style: const TextStyle(color: kTextMuted, fontSize: 13))),
      Text(value, style: const TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w600)),
    ]),
  );

  Future<void> _marcarPagado(BuildContext ctx) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        title: const Text('Confirmar pago'),
        content: Text('¿Marcar el control de pagos de ${nomina.nombreEmpleado} como pagado?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: kPrimary),
            child: const Text('Confirmar')),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<NominaProvider>().marcarPagada(nomina.id);
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          const SnackBar(content: Text('Control de pagos marcado como pagado'), backgroundColor: kPrimary));
        Navigator.pop(ctx);
      }
    } catch (e) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: kError));
    }
  }

  Future<void> _accion(BuildContext ctx, String accion) async {
    if (accion != 'eliminar') return;
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar registro'),
        content: const Text('¿Eliminar este registro permanentemente?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: kError),
            child: const Text('Eliminar')),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<NominaProvider>().eliminar(nomina.id);
      if (ctx.mounted) Navigator.pop(ctx);
    } catch (e) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: kError));
    }
  }
}
