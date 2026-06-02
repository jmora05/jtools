class Empleado {
  final int id;
  final String nombres;
  final String apellidos;
  final String tipoDocumento;
  final String numeroDocumento;
  final String telefono;
  final String email;
  final String cargo;
  final String area;
  final String? direccion;
  final String? ciudad;
  final String fechaIngreso;
  final double salario;
  final String estado;

  Empleado({
    required this.id,
    required this.nombres,
    required this.apellidos,
    required this.tipoDocumento,
    required this.numeroDocumento,
    required this.telefono,
    required this.email,
    required this.cargo,
    required this.area,
    this.direccion,
    this.ciudad,
    required this.fechaIngreso,
    required this.salario,
    required this.estado,
  });

  String get nombreCompleto => '$nombres $apellidos';
  bool get activo => estado == 'activo';

  factory Empleado.fromJson(Map<String, dynamic> j) => Empleado(
        id: int.tryParse(j['id'].toString()) ?? 0,
        nombres: j['nombres']?.toString() ?? '',
        apellidos: j['apellidos']?.toString() ?? '',
        tipoDocumento: j['tipoDocumento']?.toString() ?? 'CC',
        numeroDocumento: j['numeroDocumento']?.toString() ?? '',
        telefono: j['telefono']?.toString() ?? '',
        email: j['email']?.toString() ?? '',
        cargo: j['cargo']?.toString() ?? '',
        area: j['area']?.toString() ?? '',
        direccion: j['direccion']?.toString(),
        ciudad: j['ciudad']?.toString(),
        fechaIngreso: j['fechaIngreso']?.toString() ?? '',
        salario: double.tryParse(j['salario']?.toString() ?? '0') ?? 0,
        estado: j['estado']?.toString() ?? 'activo',
      );

  Map<String, dynamic> toJson() => {
        'nombres': nombres,
        'apellidos': apellidos,
        'tipoDocumento': tipoDocumento,
        'numeroDocumento': numeroDocumento,
        'telefono': telefono,
        'email': email,
        'cargo': cargo,
        'area': area,
        if (direccion != null) 'direccion': direccion,
        if (ciudad != null) 'ciudad': ciudad,
        'fechaIngreso': fechaIngreso,
        'salario': salario,
        'estado': estado,
      };
}
