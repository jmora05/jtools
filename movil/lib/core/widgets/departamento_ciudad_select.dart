import 'package:flutter/material.dart';
import '../constants.dart';
import '../colombia_departamentos_ciudades.dart';

// Campo tipo dropdown con búsqueda en un bottom sheet, ya que Flutter no
// trae un combobox con filtro de texto nativo. Se integra como FormField
// para que Form.validate() lo recoja igual que un TextFormField.
class SearchableDropdownField extends FormField<String> {
  SearchableDropdownField({
    super.key,
    required String label,
    required List<String> items,
    String? value,
    required ValueChanged<String?> onChanged,
    bool enabled = true,
    Widget? prefix,
    String? Function(String?)? validator,
  }) : super(
          initialValue: value,
          enabled: enabled,
          validator: validator,
          builder: (state) {
            final hasValue = (state.value ?? '').isNotEmpty;
            return InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: enabled
                  ? () async {
                      final seleccion = await _abrirBuscador(
                        state.context,
                        titulo: label.replaceAll(' *', ''),
                        items: items,
                        actual: state.value,
                      );
                      if (seleccion != null) {
                        state.didChange(seleccion);
                        onChanged(seleccion);
                      }
                    }
                  : null,
              child: InputDecorator(
                decoration: kInputDeco(label, prefix: prefix).copyWith(
                  errorText: state.errorText,
                  suffixIcon: const Icon(Icons.keyboard_arrow_down_rounded, color: kTextMuted),
                ),
                child: Text(
                  hasValue
                      ? state.value!
                      : (enabled ? 'Seleccionar' : 'Selecciona primero el departamento'),
                  style: TextStyle(fontSize: 14, color: hasValue ? kText : kTextMuted),
                ),
              ),
            );
          },
        );
}

Future<String?> _abrirBuscador(
  BuildContext context, {
  required String titulo,
  required List<String> items,
  String? actual,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (_) => _BuscadorSheet(titulo: titulo, items: items, actual: actual),
  );
}

class _BuscadorSheet extends StatefulWidget {
  final String titulo;
  final List<String> items;
  final String? actual;
  const _BuscadorSheet({required this.titulo, required this.items, this.actual});

  @override
  State<_BuscadorSheet> createState() => _BuscadorSheetState();
}

class _BuscadorSheetState extends State<_BuscadorSheet> {
  late final TextEditingController _buscar;
  late List<String> _filtrados;

  @override
  void initState() {
    super.initState();
    _buscar = TextEditingController();
    _filtrados = widget.items;
  }

  @override
  void dispose() {
    _buscar.dispose();
    super.dispose();
  }

  void _filtrar(String q) {
    final query = q.trim().toLowerCase();
    setState(() {
      _filtrados = query.isEmpty
          ? widget.items
          : widget.items.where((i) => i.toLowerCase().contains(query)).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (_, scrollCtrl) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Column(
          children: [
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
            Text(widget.titulo, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: kText)),
            const SizedBox(height: 12),
            TextField(
              controller: _buscar,
              autofocus: true,
              onChanged: _filtrar,
              decoration: kInputDeco('Buscar', prefix: const Icon(Icons.search, color: kTextMuted)),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _filtrados.isEmpty
                  ? const Center(child: Text('Sin resultados', style: TextStyle(color: kTextMuted)))
                  : ListView.builder(
                      controller: scrollCtrl,
                      itemCount: _filtrados.length,
                      itemBuilder: (_, i) {
                        final item = _filtrados[i];
                        final seleccionado = item == widget.actual;
                        return ListTile(
                          title: Text(item),
                          trailing: seleccionado ? const Icon(Icons.check, color: kPrimary) : null,
                          onTap: () => Navigator.pop(context, item),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// Selector compuesto Departamento → Ciudad: elegir el departamento filtra y
// resetea la ciudad, igual que en la web (DepartamentoCiudadSelect.tsx).
class DepartamentoCiudadSelect extends StatelessWidget {
  final String? departamento;
  final String? ciudad;
  final ValueChanged<String?> onDepartamentoChanged;
  final ValueChanged<String?> onCiudadChanged;
  final bool departamentoRequired;
  final bool ciudadRequired;

  const DepartamentoCiudadSelect({
    super.key,
    required this.departamento,
    required this.ciudad,
    required this.onDepartamentoChanged,
    required this.onCiudadChanged,
    this.departamentoRequired = true,
    this.ciudadRequired = true,
  });

  @override
  Widget build(BuildContext context) {
    final ciudades = ciudadesPorDepartamento(departamento ?? '');
    return Column(
      children: [
        SearchableDropdownField(
          key: ValueKey('departamento-$departamento'),
          label: departamentoRequired ? 'Departamento *' : 'Departamento',
          items: todosLosDepartamentos(),
          value: departamento,
          prefix: const Icon(Icons.map_outlined, color: kTextMuted),
          onChanged: (v) {
            onDepartamentoChanged(v);
            onCiudadChanged(null);
          },
          validator: departamentoRequired
              ? (v) => (v == null || v.trim().isEmpty) ? 'Requerido' : null
              : null,
        ),
        const SizedBox(height: 12),
        SearchableDropdownField(
          key: ValueKey('ciudad-$departamento-$ciudad'),
          label: ciudadRequired ? 'Ciudad *' : 'Ciudad',
          items: ciudades,
          value: ciudad,
          enabled: (departamento ?? '').isNotEmpty,
          prefix: const Icon(Icons.location_city_outlined, color: kTextMuted),
          onChanged: onCiudadChanged,
          validator: ciudadRequired
              ? (v) => (v == null || v.trim().isEmpty) ? 'Requerida' : null
              : null,
        ),
      ],
    );
  }
}
