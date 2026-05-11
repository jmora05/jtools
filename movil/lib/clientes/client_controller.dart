import 'package:flutter/material.dart';
import '../clientes/client_model.dart';

class ClientController extends ChangeNotifier {
  List<ClientModel> clients = [
    ClientModel(
      id: "1",
      name: "Juan",
      lastName: "Pérez",
      email: "juan.perez@gmail.com",
      phone: "+56 9 1234 5678",
      address: "Calle Falsa 123",
      city: "Madrid",
      status: "Activo",
      company: "Taller Mecánico JP",
    )
  ];

  /// Agregar un cliente
  void addClient(ClientModel client) {
    clients.add(client);
    notifyListeners();
  }

  /// Actualizar un cliente existente
  void updateClient(ClientModel updated) {
    final index = clients.indexWhere((c) => c.id == updated.id);
    if (index != -1) {
      clients[index] = updated;
      notifyListeners();
    }
  }

  /// Eliminar cliente por ID
  void removeClient(String id) {
    clients.removeWhere((c) => c.id == id);
    notifyListeners();
  }
}
