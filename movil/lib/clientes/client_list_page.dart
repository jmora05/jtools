import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../clientes/client_controller.dart';
import 'client_detail_page.dart';
import 'client_form_page.dart';

class ClientListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final controller = Provider.of<ClientController>(context);
    TextEditingController searchCtrl = TextEditingController();

    return Scaffold(
      appBar: AppBar(title: Text("Clientes")),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: searchCtrl,
              decoration: InputDecoration(
                hintText: "Buscar cliente...",
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onChanged: (_) => controller.notifyListeners(),
            ),
          ),

          Expanded(
            child: ListView(
              children: controller.clients
                  .where((c) => c.name
                      .toLowerCase()
                      .contains(searchCtrl.text.toLowerCase()))
                  .map(
                    (c) => ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.blue,
                        child: Text(
                          c.name[0],
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                      title: Text("${c.name} ${c.lastName}"),
                      subtitle: Text(c.phone),

                      // 👉 Aquí ponemos el ícono en vez del Chip
                       trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _statusIcon(c.status), // Activo/Inactivo
                          SizedBox(width: 10),
                          Icon(Icons.arrow_forward_ios, color: Colors.grey),
                        ],

                     ),
                      onTap: () => Navigator.push(
                        context,
                         
                        MaterialPageRoute(
                          builder: (_) => ClientDetailPage(client: c),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
      ),

      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.blue,
        child: Icon(Icons.add, color: Colors.white),
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ClientFormPage(),
          ),
        ),
      ),
    );
  }

  // -------------------------------
  // ÍCONO DE ACTIVO / INACTIVO
  // -------------------------------
  Widget _statusIcon(String status) {
    switch (status) {
      case "Activo":
        return const Icon(Icons.check_circle, color: Colors.green, size: 28);


      case "Inactivo":
        return const Icon(Icons.remove_circle, color: Color.fromARGB(255, 83, 71, 70), size: 28);

      default:
        return const Icon(Icons.help, color: Colors.grey, size: 28);
    }
  }
}
