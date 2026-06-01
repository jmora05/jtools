class Insumo {
  final int id;
  final String nombreInsumo;
  final String? codigoInsumo;
  final String unidadMedida;
  final double precioUnitario;
  final int cantidad;
  final bool estado; // true = disponible

  Insumo({
    required this.id,
    required this.nombreInsumo,
    this.codigoInsumo,
    required this.unidadMedida,
    required this.precioUnitario,
    required this.cantidad,
    required this.estado,
  });

  bool get disponible => estado && cantidad > 0;
  bool get stockBajo => cantidad < 5;

  factory Insumo.fromJson(Map<String, dynamic> j) => Insumo(
        id: int.tryParse(j['id'].toString()) ?? 0,
        nombreInsumo: j['nombreInsumo']?.toString() ?? '',
        codigoInsumo: j['codigoInsumo']?.toString(),
        unidadMedida: j['unidadMedida']?.toString() ?? '',
        precioUnitario: double.tryParse(j['precioUnitario'].toString()) ?? 0,
        cantidad: int.tryParse(j['cantidad']?.toString() ?? '0') ?? 0,
        estado: j['estado'] == true || j['estado'] == 'activo' || j['estado'] == 'disponible',
      );
}
