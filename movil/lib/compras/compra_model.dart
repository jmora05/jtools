class DetalleCompra {
  final int? id;
  final int insumosId;
  final int cantidad;
  final double precioUnitario;
  final double cantidadMerma;
  final String? nombreInsumo;
  final String? unidadMedida;

  DetalleCompra({
    this.id,
    required this.insumosId,
    required this.cantidad,
    required this.precioUnitario,
    this.cantidadMerma = 0,
    this.nombreInsumo,
    this.unidadMedida,
  });

  double get subtotal => cantidad * precioUnitario;

  factory DetalleCompra.fromJson(Map<String, dynamic> j) => DetalleCompra(
        id: j['id'] != null ? int.tryParse(j['id'].toString()) : null,
        insumosId: int.tryParse(j['insumosId'].toString()) ?? 0,
        cantidad: (double.tryParse(j['cantidad']?.toString() ?? '0') ?? 0).round(),
        precioUnitario: double.tryParse(j['precioUnitario'].toString()) ?? 0,
        cantidadMerma: double.tryParse(j['cantidadMerma']?.toString() ?? '0') ?? 0,
        nombreInsumo: j['insumo']?['nombreInsumo'],
        unidadMedida: j['insumo']?['unidadMedida'],
      );

  Map<String, dynamic> toJson() => {
        'insumosId': insumosId,
        'cantidad': cantidad,
        'precioUnitario': precioUnitario,
      };
}

class Compra {
  final int id;
  final int proveedoresId;
  final String fecha;
  final String metodoPago;
  final String estado;
  final String? numeroFactura;
  final String? nombreProveedor;
  final List<DetalleCompra> detalles;
  // IVA en porcentaje (ej. 19 = 19%). Editable por compra, igual que la web.
  final double ivaPorcentaje;

  Compra({
    required this.id,
    required this.proveedoresId,
    required this.fecha,
    required this.metodoPago,
    required this.estado,
    this.numeroFactura,
    this.nombreProveedor,
    this.detalles = const [],
    this.ivaPorcentaje = 19,
  });

  double get subtotal => detalles.fold(0, (s, d) => s + d.subtotal);
  double get iva => subtotal * (ivaPorcentaje / 100);
  double get total => subtotal + iva;

  static const Map<String, String> estadoLabel = {
    'pendiente': 'Pendiente',
    'en transito': 'En tránsito',
    'completada': 'Completada',
    'anulada': 'Anulada',
  };

  factory Compra.fromJson(Map<String, dynamic> j) => Compra(
        id: int.tryParse(j['id'].toString()) ?? 0,
        proveedoresId: int.tryParse(j['proveedoresId'].toString()) ?? 0,
        fecha: j['fecha']?.toString() ?? '',
        metodoPago: j['metodoPago']?.toString() ?? '',
        estado: j['estado']?.toString() ?? 'pendiente',
        numeroFactura: j['numeroFactura']?.toString(),
        nombreProveedor: j['proveedor']?['nombreEmpresa']?.toString(),
        detalles: (j['detalles'] as List? ?? [])
            .map((d) => DetalleCompra.fromJson(d as Map<String, dynamic>)).toList(),
      );
}
