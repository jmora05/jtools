import 'package:flutter/material.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(debugShowCheckedModeBanner: false, home: FormPage());
  }
}

class FormPage extends StatelessWidget {
  FormPage({super.key});

  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: Color.fromARGB(255, 245, 245, 245),
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              Navigator.pop(context);
            },
          ),
          title: Text("Recuperar contraseña"),
        ),
        body: Column(
          children: [
            Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(
                    'Ingresa tu correo electronico',
                    style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 30),
                  Text(
                    'Te enviaremos un codigo de recuperacion a el correo para poder restablecer la contraseña.',
                    style: TextStyle(fontSize: 20,),
                  ),
                  SizedBox(height: 30),
                  Form(
                    key: _formKey, // llave del formulario
                    child: Column(
                      children: [
                        Container(
                          height: 30,
                          width: double.infinity,
                          padding: const EdgeInsets.only(left: 10),
                          child: const Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Correo electronico',
                              style: TextStyle(fontSize: 15),
                            ),
                          ),
                        ),

                        TextFormField(
                          decoration: const InputDecoration(
                            hintText: "Ingresa tu correo electrónico",
                            border: OutlineInputBorder(),
                          ),
                          // validación del campo
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "El correo electrónico es obligatorio";
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            minimumSize: Size(
                              double.infinity,
                              50,
                            ), // ancho completo
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          onPressed: () {
                            if (_formKey.currentState!.validate()) {
                              // Si todo está bien
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text("Formulario válido"),
                                ),
                              );
                            }
                          },
                          child: const Text(
                            "Enviar codigo de recuperación",
                            style: TextStyle(color: Colors.black, fontSize: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
