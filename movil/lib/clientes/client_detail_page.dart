import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../clientes/client_model.dart';
import '../clientes/client_controller.dart';
import 'client_form_page.dart';

class ClientDetailPage extends StatelessWidget {
  final ClientModel client;
  const ClientDetailPage({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    final controller =
        Provider.of<ClientController>(context, listen: false);

    final isSmallScreen = MediaQuery.of(context).size.height < 700;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Detalles del Cliente"),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              /// 🔵 HEADER CENTRADO
              Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: isSmallScreen ? 30 : 40,
                    backgroundColor: Colors.blue,
                    child: Text(
                      client.name.isNotEmpty ? client.name[0] : "",
                      style: TextStyle(
                        fontSize: isSmallScreen ? 28 : 40,
                        color: Colors.white,
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  Text(
                    "${client.name} ${client.lastName}",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: isSmallScreen ? 18 : 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 4),

                  Text(
                    client.email,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey),
                  ),

                  const SizedBox(height: 8),

                  Chip(
                    label: Text(client.status),
                    backgroundColor: client.status == "Activo"
                        ? Colors.green.shade100
                        : Colors.red.shade100,
                    labelStyle: TextStyle(
                      color: client.status == "Activo"
                          ? Colors.green
                          : Colors.red,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 30),

              /// 📄 INFORMACIÓN
              const Text(
                "Información del Cliente",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 10),

              _info("Teléfono", client.phone),
              _info("Ciudad", client.city),
              _info("Dirección", client.address),
              if (client.company != null && client.company!.isNotEmpty)
                _info("Empresa", client.company!),

              const SizedBox(height: 30),

              /// ✏️ BOTÓN EDITAR
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  minimumSize: const Size(double.infinity, 45),
                ),
                child: const Text(
                  "Editar Cliente",
                  style: TextStyle(color: Colors.white),
                ),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ClientFormPage(editClient: client),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              /// 🗑 BOTÓN ELIMINAR
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  minimumSize: const Size(double.infinity, 45),
                ),
                child: const Text(
                  "Eliminar Cliente",
                  style: TextStyle(color: Colors.white),
                ),
                onPressed: () =>
                    _confirmDelete(context, controller),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _info(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.grey)),
          Text(
            value,
            style: const TextStyle(fontSize: 16),
            softWrap: true,
          ),
        ],
      ),
    );
  }

  /// 🧾 CONFIRMACIÓN ELIMINAR
  void _confirmDelete(
      BuildContext context, ClientController controller) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Confirmar eliminación"),
        content: const Text(
            "¿Seguro que quieres eliminar este cliente?"),
        actions: [
          TextButton(
            child: const Text("Cancelar"),
            onPressed: () => Navigator.pop(context),
          ),
          ElevatedButton(
            style:
                ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text(
              "Eliminar",
              style: TextStyle(color: Colors.white),
            ),
            onPressed: () {
              controller.removeClient(client.id);
              Navigator.pop(context);
              Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}
