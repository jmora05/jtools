class Nomina {
  final int id;
  final int empleadoId;
  final double salarioBase;
  final double auxilioTransporte;
  final int diasTrabajados;
  final String fechaInicioPeriodo;
  final String fechaFinPeriodo;
  final String fechaPago;
  final double pagoNeto;
  final String estado; // 'pendiente' | 'pagado'
  final String? nombreEmpleado;
  final String? cargoEmpleado;
  final String? documentoEmpleado;

  Nomina({
    required this.id,
    required this.empleadoId,
    required this.salarioBase,
    required this.auxilioTransporte,
    required this.diasTrabajados,
    required this.fechaInicioPeriodo,
    required this.fechaFinPeriodo,
    required this.fechaPago,
    required this.pagoNeto,
    required this.estado,
    this.nombreEmpleado,
    this.cargoEmpleado,
    this.documentoEmpleado,
  });

  bool get pagado => estado == 'pagado';

  factory Nomina.fromJson(Map<String, dynamic> j) {
    final emp = j['empleado'];
    return Nomina(
      id: int.tryParse(j['id'].toString()) ?? 0,
      empleadoId: int.tryParse(j['empleado_id'].toString()) ?? 0,
      salarioBase: double.tryParse(j['salario_base']?.toString() ?? '0') ?? 0,
      auxilioTransporte: double.tryParse(j['auxilio_transporte']?.toString() ?? '0') ?? 0,
      diasTrabajados: int.tryParse(j['dias_trabajados']?.toString() ?? '30') ?? 30,
      fechaInicioPeriodo: j['fecha_inicio_periodo']?.toString() ?? '',
      fechaFinPeriodo: j['fecha_fin_periodo']?.toString() ?? '',
      fechaPago: j['fecha_pago']?.toString() ?? '',
      pagoNeto: double.tryParse(j['pago_neto']?.toString() ?? '0') ?? 0,
      estado: j['estado']?.toString() ?? 'pendiente',
      nombreEmpleado: emp != null
          ? '${emp['nombres']} ${emp['apellidos']}' : null,
      cargoEmpleado: emp?['cargo']?.toString(),
      documentoEmpleado: emp != null
          ? '${emp['tipoDocumento']} ${emp['numeroDocumento']}' : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'empleado_id': empleadoId,
        'salario_base': salarioBase,
        'auxilio_transporte': auxilioTransporte,
        'dias_trabajados': diasTrabajados,
        'fecha_inicio_periodo': fechaInicioPeriodo,
        'fecha_fin_periodo': fechaFinPeriodo,
        'fecha_pago': fechaPago,
        'pago_neto': pagoNeto,
        'estado': estado,
      };
}
