import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../empleados/empleado_model.dart';
import '../empleados/empleado_provider.dart';
import 'nomina_provider.dart';

class NominaFormPage extends StatefulWidget {
  const NominaFormPage({super.key});
  @override State<NominaFormPage> createState() => _NominaFormPageState();
}

class _NominaFormPageState extends State<NominaFormPage> {
  final _key = GlobalKey<FormState>();
  bool _saving = false;

  Empleado? _empleado;
  late final TextEditingController _salario, _auxilio, _dias, _neto;
  String _fechaInicio = '';
  String _fechaFin = '';
  String _fechaPago = DateTime.now().toIso8601String().split('T')[0];

  // Avisos transitorios de "límite de dígitos excedido"; solo se muestran mientras
  // el usuario intenta escribir de más y se limpian en cualquier otra edición válida.
  String? _diasLimiteError;
  String? _salarioLimiteError;
  String? _auxilioLimiteError;

  static const double kSalarioMin = 1423500;
  static const double kAuxilioTransporte = 200000;

  @override
  void initState() {
    super.initState();
    _salario = TextEditingController();
    _auxilio = TextEditingController(text: kAuxilioTransporte.toStringAsFixed(0));
    _dias = TextEditingController(text: '30');
    _neto = TextEditingController();

    final now = DateTime.now();
    final inicio = DateTime(now.year, now.month, 1);
    final fin = DateTime(now.year, now.month + 1, 0);
    _fechaInicio = inicio.toIso8601String().split('T')[0];
    _fechaFin = fin.toIso8601String().split('T')[0];

    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<EmpleadoProvider>().cargar());
  }

  @override
  void dispose() {
    for (final c in [_salario, _auxilio, _dias, _neto]) {
      c.dispose();
    }
    super.dispose();
  }

  void _calcularNeto() {
    final sal = double.tryParse(_salario.text) ?? 0;
    final aux = double.tryParse(_auxilio.text) ?? 0;
    final dias = int.tryParse(_dias.text) ?? 30;
    final salProp = (sal / 30) * dias;
    final neto = salProp + aux;
    _neto.text = neto.toStringAsFixed(0);
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);
    final empProv = context.watch<EmpleadoProvider>();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: const Text('Nuevo Control de Pagos', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: Form(
        key: _key,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _seccion('Empleado', [
              DropdownButtonFormField<Empleado>(
                initialValue: _empleado,
                decoration: kInputDeco('Seleccionar empleado'),
                items: empProv.empleados.where((e) => e.activo).map((e) =>
                  DropdownMenuItem(
                    value: e,
                    child: Text('${e.nombreCompleto} (${e.cargo})'),
                  )).toList(),
                validator: (v) => v == null ? 'Requerido' : null,
                onChanged: (e) {
                  setState(() {
                    _empleado = e;
                    if (e != null) {
                      _salario.text = e.salario.toStringAsFixed(0);
                      _auxilio.text = e.salario <= kSalarioMin * 2
                          ? kAuxilioTransporte.toStringAsFixed(0)
                          : '0';
                      _calcularNeto();
                    }
                  });
                },
              ),
            ]),
            _seccion('Período', [
              Row(children: [
                Expanded(child: _datePicker('Inicio período', _fechaInicio,
                  (d) => setState(() { _fechaInicio = d; _calcularNeto(); }))),
                const SizedBox(width: 8),
                Expanded(child: _datePicker('Fin período', _fechaFin,
                  (d) => setState(() { _fechaFin = d; _calcularNeto(); }))),
              ]),
              const SizedBox(height: 12),
              _datePicker('Fecha de pago', _fechaPago,
                (d) => setState(() => _fechaPago = d)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _dias,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  MaxDigitsFormatter(2, () => setState(() =>
                      _diasLimiteError = 'No se pueden ingresar más de 2 números.')),
                ],
                decoration: kInputDeco('Días trabajados'),
                onChanged: (_) => setState(() {
                  _diasLimiteError = null;
                  _calcularNeto();
                }),
                validator: (v) {
                  final s = (v ?? '').trim();
                  if (s.isEmpty) return 'Este campo es obligatorio.';
                  if (!RegExp(r'^[0-9]+$').hasMatch(s)) return 'Solo se permiten números enteros.';
                  final n = int.tryParse(s);
                  if (n == null || n < 1 || n > 30) return 'Entre 1 y 30';
                  return null;
                },
              ),
              fieldError(_diasLimiteError),
            ]),
            _seccion('Valores', [
              TextFormField(
                controller: _salario,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  MaxDigitsFormatter(9, () => setState(() =>
                      _salarioLimiteError = 'No se pueden ingresar más de 9 números.')),
                ],
                decoration: kInputDeco('Salario base mensual'),
                onChanged: (_) => setState(() {
                  _salarioLimiteError = null;
                  _calcularNeto();
                }),
                validator: (v) {
                  final s = (v ?? '').trim();
                  if (s.isEmpty) return 'Este campo es obligatorio.';
                  if (!RegExp(r'^[0-9]+$').hasMatch(s)) return 'Solo se permiten números enteros.';
                  if (s.length > 9) return 'Máximo 9 dígitos.';
                  final n = double.tryParse(s);
                  if (n == null || n <= 0) return 'El salario debe ser mayor a 0.';
                  return null;
                },
              ),
              fieldError(_salarioLimiteError),
              const SizedBox(height: 12),
              TextFormField(
                controller: _auxilio,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  MaxDigitsFormatter(7, () => setState(() =>
                      _auxilioLimiteError = 'No se pueden ingresar más de 7 números.')),
                ],
                decoration: kInputDeco('Auxilio de transporte'),
                onChanged: (_) => setState(() {
                  _auxilioLimiteError = null;
                  _calcularNeto();
                }),
                validator: (v) {
                  final s = (v ?? '').trim();
                  if (s.isEmpty) return 'Este campo es obligatorio.';
                  if (!RegExp(r'^[0-9]+$').hasMatch(s)) return 'Solo se permiten números enteros.';
                  if (s.length > 7) return 'Máximo 7 dígitos.';
                  return null;
                },
              ),
              fieldError(_auxilioLimiteError),
            ]),
            if (_neto.text.isNotEmpty) ...[
              Container(
                width: double.infinity, padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(children: [
                  Text('NETO CALCULADO', style: kLabel.copyWith(color: Colors.white70)),
                  const SizedBox(height: 4),
                  Text(fmt.format(double.tryParse(_neto.text) ?? 0),
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text('Salario prop. + Aux. transporte',
                    style: const TextStyle(color: Colors.white60, fontSize: 12)),
                ]),
              ),
              const SizedBox(height: 12),
            ],
            SizedBox(
              width: double.infinity, height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary, foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _saving ? null : _registrar,
                child: _saving
                  ? const SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Registrar pago', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 40),
          ]),
        ),
      ),
    );
  }

  Widget _datePicker(String label, String value, void Function(String) onPick) =>
    TextFormField(
      readOnly: true,
      controller: TextEditingController(text: value),
      decoration: kInputDeco(label, prefix: const Icon(Icons.calendar_today, color: kTextMuted, size: 18)),
      validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null,
      onTap: () async {
        final d = await showDatePicker(
          context: context,
          initialDate: DateTime.tryParse(value) ?? DateTime.now(),
          firstDate: DateTime(2020), lastDate: DateTime(2030),
        );
        if (d != null) onPick(d.toIso8601String().split('T')[0]);
      },
    );

  Widget _seccion(String titulo, List<Widget> children) => Card(
    margin: const EdgeInsets.only(bottom: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(titulo.toUpperCase(), style: kLabel),
        const SizedBox(height: 12),
        ...children,
      ]),
    ),
  );

  Future<void> _registrar() async {
    if (!_key.currentState!.validate()) return;
    if (_empleado == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona un empleado'), backgroundColor: kError));
      return;
    }
    setState(() => _saving = true);
    try {
      final neto = double.tryParse(_neto.text) ?? 0;
      await context.read<NominaProvider>().crear({
        'empleado_id': _empleado!.id,
        'salario_base': double.parse(_salario.text),
        'auxilio_transporte': double.tryParse(_auxilio.text) ?? 0,
        'dias_trabajados': int.parse(_dias.text),
        'fecha_inicio_periodo': _fechaInicio,
        'fecha_fin_periodo': _fechaFin,
        'fecha_pago': _fechaPago,
        'pago_neto': neto,
        'estado': 'pendiente',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pago registrado exitosamente'), backgroundColor: kPrimary));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: kError));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
