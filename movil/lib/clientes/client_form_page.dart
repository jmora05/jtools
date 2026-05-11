import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../clientes/client_model.dart';
import '../clientes/client_controller.dart';

class ClientFormPage extends StatefulWidget {
  final ClientModel? editClient;

  const ClientFormPage({super.key, this.editClient});

  @override
  State<ClientFormPage> createState() => _ClientFormPageState();
}

class _ClientFormPageState extends State<ClientFormPage> {
  final formKey = GlobalKey<FormState>();

  late TextEditingController name;
  late TextEditingController lastName;
  late TextEditingController email;
  late TextEditingController phone;
  late TextEditingController address;
  late TextEditingController city;
  late TextEditingController company;

  /// Estado por defecto
  String status = "Activo";

  @override
  void initState() {
    super.initState();

    name = TextEditingController(text: widget.editClient?.name ?? "");
    lastName = TextEditingController(text: widget.editClient?.lastName ?? "");
    email = TextEditingController(text: widget.editClient?.email ?? "");
    phone = TextEditingController(text: widget.editClient?.phone ?? "");
    address = TextEditingController(text: widget.editClient?.address ?? "");
    city = TextEditingController(text: widget.editClient?.city ?? "");
    company = TextEditingController(text: widget.editClient?.company ?? "");

    /// Si es editar, toma el estado real; si es crear → Activo
    status = widget.editClient?.status ?? "Activo";
  }

  @override
  Widget build(BuildContext context) {
    final controller = Provider.of<ClientController>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.editClient == null
              ? "Registrar Cliente"
              : "Editar Cliente",
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: formKey,
          child: Column(
            children: [
              _field(name, "Nombre"),
              _field(lastName, "Apellidos"),
              _field(company, "Empresa (Opcional)"),

              _field(
                email,
                "Correo Electrónico",
                validator: (v) =>
                    v != null && v.contains("@") ? null : "Email inválido",
              ),

              _field(phone, "Teléfono"),
              _field(address, "Dirección"),
              _field(city, "Ciudad"),

              const SizedBox(height: 20),

              /// 🔥 ESTADO SOLO EN EDITAR
              if (widget.editClient != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Estado del Cliente",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      ...["Activo", "Inactivo"].map(
                        (op) => RadioListTile(
                          fillColor:
                              MaterialStateProperty.all(Colors.blue),
                          value: op,
                          title: Text(op),
                          groupValue: status,
                          onChanged: (v) =>
                              setState(() => status = v.toString()),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                ),
                child: Text(
                  widget.editClient == null
                      ? "Guardar Cliente"
                      : "Actualizar Cliente",
                  style: const TextStyle(color: Colors.white),
                ),
                onPressed: () {
                  if (!formKey.currentState!.validate()) return;

                  final client = ClientModel(
                    id: widget.editClient?.id ??
                        DateTime.now().toIso8601String(),
                    name: name.text.trim(),
                    lastName: lastName.text.trim(),
                    email: email.text.trim(),
                    phone: phone.text.trim(),
                    address: address.text.trim(),
                    city: city.text.trim(),
                    company: company.text.trim(),
                    status: status, // 👈 siempre Activo al crear
                  );

                  if (widget.editClient == null) {
                    controller.addClient(client);
                  } else {
                    controller.updateClient(client);
                  }

                  Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label, {
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: TextFormField(
        controller: c,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }
}
