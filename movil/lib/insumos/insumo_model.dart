class Insumo {
  final int id;
  final String nombreInsumo;
  final String? descripcion;
  final String? codigoInsumo;
  final String unidadMedida;
  final double precioUnitario;
  final int cantidad;
  final String estado; // 'disponible' | 'agotado'

  Insumo({
    required this.id,
    required this.nombreInsumo,
    this.descripcion,
    this.codigoInsumo,
    required this.unidadMedida,
    required this.precioUnitario,
    required this.cantidad,
    required this.estado,
  });

  bool get disponible => estado == 'disponible' && cantidad > 0;
  bool get agotado    => estado == 'agotado' || cantidad == 0;
  bool get stockBajo  => estado == 'disponible' && cantidad > 0 && cantidad < 5;

  factory Insumo.fromJson(Map<String, dynamic> j) => Insumo(
        id:             int.tryParse(j['id'].toString()) ?? 0,
        nombreInsumo:   j['nombreInsumo']?.toString() ?? '',
        descripcion:    j['descripcion']?.toString(),
        codigoInsumo:   j['codigoInsumo']?.toString(),
        unidadMedida:   j['unidadMedida']?.toString() ?? '',
        precioUnitario: double.tryParse(j['precioUnitario']?.toString() ?? '0') ?? 0,
        cantidad:       int.tryParse(j['cantidad']?.toString() ?? '0') ?? 0,
        estado:         _normalizeEstado(j['estado']),
      );

  static String _normalizeEstado(dynamic v) {
    final s = v?.toString() ?? '';
    if (s == 'disponible' || s == 'activo' || s == 'true') return 'disponible';
    return 'agotado';
  }

  Map<String, dynamic> toJson() => {
        'nombreInsumo':   nombreInsumo,
        if (descripcion != null && descripcion!.isNotEmpty) 'descripcion': descripcion,
        if (codigoInsumo != null && codigoInsumo!.isNotEmpty) 'codigoInsumo': codigoInsumo,
        'unidadMedida':   unidadMedida,
        'precioUnitario': precioUnitario,
        'cantidad':       cantidad,
        'estado':         estado,
      };
}
