import 'package:flutter/material.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: FormPage()
      );
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
        body: Column(
          children: [
            Container(
              padding: EdgeInsets.all(15.0),
              child: Image.asset("assets/images/logos/login.jpeg"),
            ),
            Padding( padding: EdgeInsets.all(20),
            child:  Column(
              children: [
                Text('Bienvenido', style: TextStyle(fontSize: 22,fontWeight: FontWeight.bold),),
                SizedBox(height: 30,),
                Form(
                  key: _formKey, // llave del formulario
                  child: Column(
                    children: [
                      Container( height: 30, width: double.infinity, padding: const EdgeInsets.only(left: 10), 
                      child: const Align( alignment: Alignment.centerLeft, 
                      child: Text( 'Correo electronico', style: TextStyle(fontSize: 15),),
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
                      Container( height: 30, width: double.infinity, padding: const EdgeInsets.only(left: 10), 
                      child: const Align( alignment: Alignment.centerLeft, 
                      child: Text( 'Contraseña', style: TextStyle(fontSize: 15),),
                      ),
                      ),
                      TextFormField(
                        decoration: const InputDecoration(
                          hintText: "Ingresa tu contraseña",
                          border: OutlineInputBorder(),
                        ),
                        // validación del campo
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return "El contraseña es obligatorio";
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          minimumSize: Size(double.infinity, 50), // ancho completo
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
                        child: const Text("Enviar", style: TextStyle(color: Colors.black, fontSize: 20, ),),
                      ),
                    ],
                  ),
                ),
              SizedBox(height: 20,),
              SizedBox(child: Text("¿olvidaste tu contraseña?"),),
              ],
            ),
            ),
          ],
        ),
      ),
    );
  }
}
