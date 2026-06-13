import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../insumos/insumo_provider.dart';
import '../insumos/insumo_model.dart';
import '../proveedores/proveedor_provider.dart';
import '../proveedores/proveedor_model.dart';
import 'compra_provider.dart';

class _ItemCarrito {
  final Insumo insumo;
  int cantidad = 1;
  double precio;
  _ItemCarrito({required this.insumo, required this.precio});
}

class CompraFormPage extends StatefulWidget {
  const CompraFormPage({super.key});
  @override State<CompraFormPage> createState() => _CompraFormPageState();
}

class _CompraFormPageState extends State<CompraFormPage> {
  final _key = GlobalKey<FormState>();
  bool _saving = false;

  Proveedor? _proveedor;
  String _metodoPago = 'efectivo';
  String _fecha = DateTime.now().toIso8601String().split('T')[0];
  final List<_ItemCarrito> _carrito = [];
  String _searchInsumo = '';

  final List<String> _metodos = ['efectivo', 'transferencia'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProveedorProvider>().cargar();
      context.read<InsumoProvider>().cargar();
    });
  }

  double get _subtotal => _carrito.fold(0, (s, i) => s + i.cantidad * i.precio);
  double get _iva => _subtotal * 0.19;
  double get _total => _subtotal + _iva;

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);
    final provProv = context.watch<ProveedorProvider>();
    final insProv = context.watch<InsumoProvider>();

    final insumosFiltrados = insProv.insumos
      .where((i) => i.disponible &&
        i.nombreInsumo.toLowerCase().contains(_searchInsumo.toLowerCase()) &&
        !_carrito.any((c) => c.insumo.id == i.id))
      .toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: const Text('Nueva Compra', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: Form(
        key: _key,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            // ── Proveedor ────────────────────────────────────────────────
            _seccion('Proveedor', [
              DropdownButtonFormField<Proveedor>(
                value: _proveedor,
                decoration: kInputDeco('Seleccionar proveedor'),
                items: provProv.proveedores.where((p) => p.activo).map((p) =>
                  DropdownMenuItem(value: p, child: Text(p.nombreEmpresa))).toList(),
                validator: (v) => v == null ? 'Requerido' : null,
                onChanged: (v) => setState(() => _proveedor = v),
              ),
            ]),

            // ── Info compra ────────────────────────────────────────────
            _seccion('Información', [
              _datePicker(fmt),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _metodoPago,
                decoration: kInputDeco('Método de pago'),
                items: _metodos.map((m) => DropdownMenuItem(
                  value: m,
                  child: Text(m[0].toUpperCase() + m.substring(1)),
                )).toList(),
                onChanged: (v) => setState(() => _metodoPago = v!),
              ),
            ]),

            // ── Carrito ────────────────────────────────────────────────
            _seccion('Insumos (${_carrito.length})', [
              // Buscador insumo
              TextField(
                onChanged: (v) => setState(() => _searchInsumo = v),
                decoration: kInputDeco('Buscar insumo para agregar...',
                  prefix: const Icon(Icons.search, color: kTextMuted)),
              ),
              if (_searchInsumo.isNotEmpty && insumosFiltrados.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: kBorder),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  constraints: const BoxConstraints(maxHeight: 200),
                  child: ListView(shrinkWrap: true, children: insumosFiltrados.map((ins) =>
                    ListTile(
                      title: Text(ins.nombreInsumo, style: const TextStyle(fontSize: 13)),
                      subtitle: Text(
                        '${ins.unidadMedida} · Stock: ${ins.cantidad}',
                        style: const TextStyle(fontSize: 11),
                      ),
                      trailing: Text(fmt.format(ins.precioUnitario),
                        style: const TextStyle(color: kPrimary, fontWeight: FontWeight.w700)),
                      onTap: () {
                        setState(() {
                          _carrito.add(_ItemCarrito(insumo: ins, precio: ins.precioUnitario));
                          _searchInsumo = '';
                        });
                      },
                    ),
                  ).toList()),
                ),
              ],
              if (_carrito.isNotEmpty) ...[
                const SizedBox(height: 12),
                ..._carrito.map((item) => _carritoRow(item, fmt)),
              ] else if (_searchInsumo.isEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity, padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    border: Border.all(color: kBorder, style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Column(children: [
                    Icon(Icons.shopping_basket_outlined, color: kBorder, size: 36),
                    SizedBox(height: 8),
                    Text('Busca insumos para agregar', style: TextStyle(color: kTextMuted, fontSize: 13)),
                  ]),
                ),
              ],
            ]),

            // ── Totales ────────────────────────────────────────────────
            if (_carrito.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(children: [
                  _totalRow('Subtotal', fmt.format(_subtotal)),
                  _totalRow('IVA (19%)', fmt.format(_iva)),
                  const Divider(color: Colors.white24),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Total', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                    Text(fmt.format(_total), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 20)),
                  ]),
                ]),
              ),
              const SizedBox(height: 16),
            ],

            SizedBox(
              width: double.infinity, height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary, foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: (_saving || _carrito.isEmpty) ? null : _registrar,
                child: _saving
                  ? const SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Registrar compra', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 40),
          ]),
        ),
      ),
    );
  }

  Widget _carritoRow(_ItemCarrito item, NumberFormat fmt) {
    final ctrlCantidad = TextEditingController(text: item.cantidad.toString());
    final ctrlPrecio = TextEditingController(text: item.precio.toStringAsFixed(0));

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Text(item.insumo.nombreInsumo,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
            GestureDetector(
              onTap: () => setState(() => _carrito.remove(item)),
              child: const Icon(Icons.close, color: kError, size: 18),
            ),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: TextFormField(
              controller: ctrlCantidad,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: kInputDeco('Cantidad'),
              onChanged: (v) => setState(() => item.cantidad = int.tryParse(v) ?? 1),
              validator: (v) {
                final n = int.tryParse(v ?? '');
                if (n == null || n <= 0) return 'Mín. 1';
                return null;
              },
            )),
            const SizedBox(width: 8),
            Expanded(child: TextFormField(
              controller: ctrlPrecio,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: kInputDeco('Precio unit.'),
              onChanged: (v) => setState(() => item.precio = double.tryParse(v) ?? 0),
              validator: (v) {
                final n = double.tryParse(v ?? '');
                if (n == null || n <= 0) return 'Inválido';
                return null;
              },
            )),
            const SizedBox(width: 8),
            Text(fmt.format(item.cantidad * item.precio),
              style: const TextStyle(fontWeight: FontWeight.w700, color: kPrimary, fontSize: 13)),
          ]),
        ]),
      ),
    );
  }

  Widget _datePicker(NumberFormat fmt) => TextFormField(
    readOnly: true,
    initialValue: _fecha,
    decoration: kInputDeco('Fecha de compra', prefix: const Icon(Icons.calendar_today, color: kTextMuted)),
    onTap: () async {
      final d = await showDatePicker(
        context: context,
        initialDate: DateTime.tryParse(_fecha) ?? DateTime.now(),
        firstDate: DateTime(2000), lastDate: DateTime.now(),
      );
      if (d != null) setState(() => _fecha = d.toIso8601String().split('T')[0]);
    },
  );

  Widget _totalRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13)),
      Text(value, style: const TextStyle(color: Colors.white, fontSize: 13)),
    ]),
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
    if (_proveedor == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona un proveedor'), backgroundColor: kError));
      return;
    }
    if (_carrito.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Agrega al menos un insumo'), backgroundColor: kError));
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<CompraProvider>().crear(
        proveedoresId: _proveedor!.id,
        fecha: _fecha,
        metodoPago: _metodoPago,
        detalles: _carrito.map((i) => {
          'insumosId': i.insumo.id,
          'cantidad': i.cantidad,
          'precioUnitario': i.precio,
        }).toList(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Compra registrada exitosamente'), backgroundColor: kPrimary));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: kError));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
