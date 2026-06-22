class Cliente {
  final int id;
  final String nombres;
  final String apellidos;
  final String email;
  final String telefono;
  final String ciudad;
  final String? direccion;
  final String tipoDocumento;
  final String numeroDocumento;
  final String? razonSocial;
  final String? contacto;
  final String estado;

  const Cliente({
    required this.id,
    required this.nombres,
    required this.apellidos,
    required this.email,
    required this.telefono,
    required this.ciudad,
    this.direccion,
    required this.tipoDocumento,
    required this.numeroDocumento,
    this.razonSocial,
    this.contacto,
    required this.estado,
  });

  bool get activo => estado == 'activo';
  String get nombreCompleto => '$nombres $apellidos'.trim();

  factory Cliente.fromJson(Map<String, dynamic> j) => Cliente(
    id:              j['id'] as int,
    nombres:         j['nombres']?.toString() ?? '',
    apellidos:       j['apellidos']?.toString() ?? '',
    email:           j['email']?.toString() ?? '',
    telefono:        j['telefono']?.toString() ?? '',
    ciudad:          j['ciudad']?.toString() ?? '',
    direccion:       j['direccion']?.toString(),
    tipoDocumento:   j['tipo_documento']?.toString() ?? '',
    numeroDocumento: j['numero_documento']?.toString() ?? '',
    razonSocial:     j['razon_social']?.toString(),
    contacto:        j['contacto']?.toString(),
    estado:          j['estado']?.toString() ?? 'activo',
  );

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{
      'nombres':          nombres,
      'apellidos':        apellidos,
      'email':            email,
      'telefono':         telefono,
      'ciudad':           ciudad,
      'tipo_documento':   tipoDocumento,
      'numero_documento': numeroDocumento,
      'estado':           estado,
    };
    if (direccion != null && direccion!.isNotEmpty) m['direccion']  = direccion;
    if (razonSocial != null && razonSocial!.isNotEmpty) m['razon_social'] = razonSocial;
    if (contacto != null && contacto!.isNotEmpty) m['contacto'] = contacto;
    return m;
  }
}
