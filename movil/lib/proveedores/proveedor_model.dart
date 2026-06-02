class Proveedor {
  final int id;
  final String tipoProveedor; // 'empresa' | 'persona'
  final String nombreEmpresa;
  final String? personaContacto;
  final String tipoDocumento;
  final String numeroDocumento;
  final String email;
  final String telefono;
  final String? ciudad;
  final String? direccion;
  final String estado; // 'activo' | 'inactivo'

  Proveedor({
    required this.id,
    required this.tipoProveedor,
    required this.nombreEmpresa,
    this.personaContacto,
    required this.tipoDocumento,
    required this.numeroDocumento,
    required this.email,
    required this.telefono,
    this.ciudad,
    this.direccion,
    required this.estado,
  });

  bool get activo => estado == 'activo';

  factory Proveedor.fromJson(Map<String, dynamic> j) => Proveedor(
        id: int.tryParse(j['id'].toString()) ?? 0,
        tipoProveedor: j['tipoProveedor']?.toString() ?? 'empresa',
        nombreEmpresa: j['nombreEmpresa']?.toString() ?? '',
        personaContacto: j['personaContacto']?.toString(),
        tipoDocumento: j['tipoDocumento']?.toString() ?? 'NIT',
        numeroDocumento: j['numeroDocumento']?.toString() ?? '',
        email: j['email']?.toString() ?? '',
        telefono: j['telefono']?.toString() ?? '',
        ciudad: j['ciudad']?.toString(),
        direccion: j['direccion']?.toString(),
        estado: j['estado']?.toString() ?? 'activo',
      );

  Map<String, dynamic> toJson() => {
        'tipoProveedor': tipoProveedor,
        'nombreEmpresa': nombreEmpresa,
        if (personaContacto != null) 'personaContacto': personaContacto,
        'tipoDocumento': tipoDocumento,
        'numeroDocumento': numeroDocumento,
        'email': email,
        'telefono': telefono,
        if (ciudad != null) 'ciudad': ciudad,
        if (direccion != null) 'direccion': direccion,
        'estado': estado,
      };
}
