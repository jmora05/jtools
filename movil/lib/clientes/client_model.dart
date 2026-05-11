class ClientModel {
  String id;
  String name;
  String lastName;
  String email;
  String phone;
  String address;
  String city;
  String status; // activo, inactivo, potencial, bloqueado
  String? company;

  ClientModel({
    required this.id,
    required this.name,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.address,
    required this.city,
    required this.status,
    this.company,
  });
}
