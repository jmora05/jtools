import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_service.dart';
import '../core/constants.dart';
import '../core/debouncer.dart';
import '../proveedores/proveedor_model.dart';
import '../proveedores/proveedor_provider.dart';
import 'insumo_model.dart';
import 'insumo_provider.dart';

const _kUnidades = [
  'Unidades', 'Kilogramos', 'Gramos', 'Metros', 'Par', 'Rollo',
];

class InsumoFormPage extends StatefulWidget {
  final Insumo? insumo;
  const InsumoFormPage({super.key, this.insumo});
  @override State<InsumoFormPage> createState() => _InsumoFormPageState();
}

class _InsumoFormPageState extends State<InsumoFormPage> {
  final _key = GlobalKey<FormState>();
  bool _saving = false;

  late final TextEditingController _nombre;
  late final TextEditingController _descripcion;
  late final TextEditingController _busquedaProveedor;
  String _unidad  = 'Unidades';
  String _estado  = 'disponible';
  List<int> _selectedProveedoresIds = [];

  // Verificación de unicidad del nombre en tiempo real (igual que la web).
  String? _errorNombreInsumo;
  final _debouncer = Debouncer();

  bool get _isEdit => widget.insumo != null;

  @override
  void initState() {
    super.initState();
    final i = widget.insumo;
    _nombre     = TextEditingController(text: i?.nombreInsumo ?? '');
    _descripcion = TextEditingController(text: i?.descripcion ?? '');
    _busquedaProveedor = TextEditingController();
    _unidad     = i?.unidadMedida ?? 'Unidades';
    if (!_kUnidades.contains(_unidad)) _unidad = 'Unidades';
    _estado     = i?.estado ?? 'disponible';
    // Cargar la selección previa del proveedor
    if (i?.proveedoresId != null) _selectedProveedoresIds = [i!.proveedoresId!];

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<ProveedorProvider>().cargar();
    });
  }

  @override
  void dispose() {
    _nombre.dispose(); _descripcion.dispose(); _busquedaProveedor.dispose();
    _debouncer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: AppBar(
      backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
      title: Text(_isEdit ? 'Editar insumo' : 'Nuevo insumo',
        style: const TextStyle(fontWeight: FontWeight.w700)),
    ),
    body: Form(
      key: _key,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [

          // ── 1. Nombre + 2. Notas (orden igual que la web) ─────────────────────
          _seccion('Información principal', [
            _buildNombre(),
            _buildDescripcion(),
          ]),

          // ── Precio (informativo, no editable) ─────────────────────────────────
          Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            color: kChipBg,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.info_outline, size: 18, color: kPrimaryDark),
                const SizedBox(width: 10),
                const Expanded(child: Text(
                  'El precio se actualiza automáticamente al registrar una compra '
                  '(siempre se conserva el mayor).',
                  style: TextStyle(fontSize: 13, color: kPrimaryDark, height: 1.4),
                )),
              ]),
            ),
          ),

          // ── 3. Proveedores (multi-selección con búsqueda) ─────────────────────
          //     La lista permanece OCULTA hasta que el usuario escribe algo en el
          //     buscador (igual que la web en SupplyManagement.tsx).
          Consumer<ProveedorProvider>(builder: (_, provProv, __) {
            final activos = provProv.proveedores.where((p) => p.activo).toList();
            final query = _busquedaProveedor.text.trim().toLowerCase();
            final mostrarLista = query.isNotEmpty;
            final filtrados = mostrarLista
              ? activos.where((p) =>
                  p.nombreEmpresa.toLowerCase().contains(query) ||
                  p.numeroDocumento.toLowerCase().contains(query)).toList()
              : <Proveedor>[];

            final seleccionados = activos
              .where((p) => _selectedProveedoresIds.contains(p.id)).toList();

            return _seccion('Proveedores (opcional)', [
              Padding(padding: const EdgeInsets.only(bottom: 10),
                child: Text('Puedes asociar uno o varios proveedores.',
                  style: const TextStyle(color: kTextMuted, fontSize: 13))),

              // Chips de seleccionados
              if (seleccionados.isNotEmpty) ...[
                Wrap(spacing: 8, runSpacing: 4,
                  children: seleccionados.map((p) => Chip(
                    label: Text(p.nombreEmpresa,
                      style: const TextStyle(fontSize: 12, color: kPrimaryDark)),
                    backgroundColor: kChipBg,
                    deleteIconColor: kPrimaryDark,
                    onDeleted: () => setState(
                      () => _selectedProveedoresIds.remove(p.id)),
                  )).toList(),
                ),
                const SizedBox(height: 8),
              ],

              // Buscador
              TextField(
                controller: _busquedaProveedor,
                onChanged: (_) => setState(() {}),
                decoration: kInputDeco('Buscar proveedores...',
                  prefix: const Icon(Icons.search, color: kTextMuted)),
              ),

              // La lista solo aparece cuando hay texto en el buscador.
              if (mostrarLista) ...[
                const SizedBox(height: 8),
                if (provProv.loading)
                  const Center(child: Padding(
                    padding: EdgeInsets.all(8),
                    child: SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(color: kPrimary, strokeWidth: 2))))
                else if (filtrados.isEmpty)
                  const Padding(padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('Sin resultados.',
                      style: TextStyle(color: kTextMuted, fontSize: 13)))
                else
                  Container(
                    constraints: const BoxConstraints(maxHeight: 200),
                    decoration: BoxDecoration(
                      border: Border.all(color: kBorder),
                      borderRadius: BorderRadius.circular(10),
                      color: Colors.white),
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: filtrados.length,
                      itemBuilder: (_, i) {
                        final p = filtrados[i];
                        final sel = _selectedProveedoresIds.contains(p.id);
                        return CheckboxListTile(
                          dense: true,
                          title: Text(p.nombreEmpresa,
                            style: const TextStyle(fontSize: 13)),
                          subtitle: Text(p.numeroDocumento,
                            style: const TextStyle(fontSize: 11, color: kTextMuted)),
                          value: sel,
                          activeColor: kPrimary,
                          controlAffinity: ListTileControlAffinity.leading,
                          onChanged: (v) => setState(() {
                            if (v == true) {
                              _selectedProveedoresIds.add(p.id);
                            } else {
                              _selectedProveedoresIds.remove(p.id);
                            }
                          }),
                        );
                      },
                    ),
                  ),
              ],
              const SizedBox(height: 4),
            ]);
          }),

          // ── 4. Unidad de medida ───────────────────────────────────────────────
          _seccion('Unidad de medida', [
            Padding(padding: const EdgeInsets.only(bottom: 12),
              child: DropdownButtonFormField<String>(
                value: _unidad,
                decoration: kInputDeco('Unidad de medida'),
                items: _kUnidades.map((u) =>
                  DropdownMenuItem(value: u, child: Text(u))).toList(),
                validator: (v) => (v?.isEmpty ?? true) ? 'Selecciona una unidad' : null,
                onChanged: (v) => setState(() => _unidad = v!),
              )),
          ]),

          // ── Estado (solo en edición) ───────────────────────────────────────────
          if (_isEdit) _seccion('Estado', [
            Padding(padding: const EdgeInsets.only(bottom: 12),
              child: DropdownButtonFormField<String>(
                value: _estado,
                decoration: kInputDeco('Estado del insumo'),
                items: const [
                  DropdownMenuItem(value: 'disponible', child: Text('Disponible')),
                  DropdownMenuItem(value: 'agotado', child: Text('Agotado')),
                ],
                onChanged: (v) => setState(() => _estado = v!),
              )),
          ]),

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity, height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimary, foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: (_saving || _errorNombreInsumo != null) ? null : _guardar,
              child: _saving
                ? const SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text(_isEdit ? 'Actualizar insumo' : 'Registrar insumo',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 40),
        ]),
      ),
    ),
  );

  Widget _buildNombre() => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      TextFormField(
        controller: _nombre,
        maxLength: 30,
        validator: (v) {
          if (v == null || v.trim().isEmpty) return 'El nombre es requerido';
          if (v.trim().length < 2) return 'Mínimo 2 caracteres';
          if (v.trim().length > 30) return 'Máximo 30 caracteres';
          return null;
        },
        decoration: kInputDeco('Nombre del insumo'),
        onChanged: (v) {
          if (_errorNombreInsumo != null) {
            setState(() => _errorNombreInsumo = null);
          }
          if (v.trim().length >= 2) {
            _debouncer.run(() async {
              final res = await ApiService.verificarUnicidad(
                modulo: 'insumos',
                campo: 'nombreInsumo',
                valor: v.trim(),
                excluirId: widget.insumo?.id,
              );
              if (mounted && res['existe'] == true) {
                setState(() => _errorNombreInsumo =
                    res['mensaje'] ?? 'Ya existe un insumo con ese nombre');
              }
            });
          }
        },
      ),
      fieldError(_errorNombreInsumo),
    ]),
  );

  Widget _buildDescripcion() => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: _descripcion,
      maxLines: 3,
      maxLength: 255,
      decoration: kInputDeco('Notas (opcional)'),
    ),
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

  Future<void> _guardar() async {
    if (!_key.currentState!.validate()) return;
    setState(() => _saving = true);
    final prov = context.read<InsumoProvider>();
    try {
      final body = <String, dynamic>{
        'nombreInsumo': _nombre.text.trim(),
        'unidadMedida': _unidad,
        if (_descripcion.text.trim().isNotEmpty) 'descripcion': _descripcion.text.trim(),
        if (_isEdit) 'estado': _estado,
        if (_selectedProveedoresIds.isNotEmpty) 'proveedoresIds': _selectedProveedoresIds,
      };
      if (_isEdit) {
        await prov.actualizar(widget.insumo!.id, body);
      } else {
        await prov.crear(body);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'Insumo actualizado' : 'Insumo registrado'),
          backgroundColor: kPrimary, behavior: SnackBarBehavior.floating,
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: kError, behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
