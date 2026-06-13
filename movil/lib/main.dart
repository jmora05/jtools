import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/constants.dart';
import 'core/auth_provider.dart';
import 'core/scaffold_key.dart';
import 'screens/login_page.dart';

import 'empleados/empleado_provider.dart';
import 'empleados/empleados_page.dart';

import 'proveedores/proveedor_provider.dart';
import 'proveedores/proveedores_page.dart';

import 'insumos/insumo_provider.dart';
import 'insumos/insumos_page.dart';

import 'compras/compra_provider.dart';
import 'compras/compras_page.dart';

import 'nomina/nomina_provider.dart';
import 'nomina/nomina_page.dart';

import 'clientes/cliente_provider.dart';
import 'clientes/clientes_page.dart';

import 'ventas/venta_provider.dart';
import 'ventas/ventas_page.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => EmpleadoProvider()),
        ChangeNotifierProvider(create: (_) => ProveedorProvider()),
        ChangeNotifierProvider(create: (_) => InsumoProvider()),
        ChangeNotifierProvider(create: (_) => CompraProvider()),
        ChangeNotifierProvider(create: (_) => NominaProvider()),
        ChangeNotifierProvider(create: (_) => ClienteProvider()),
        ChangeNotifierProvider(create: (_) => VentaProvider()),
      ],
      child: const JToolsApp(),
    ),
  );
}

class JToolsApp extends StatelessWidget {
  const JToolsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JTools',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: kPrimary),
        useMaterial3: true,
        fontFamily: 'Roboto',
        scaffoldBackgroundColor: kBg,
        appBarTheme: const AppBarTheme(
          backgroundColor: kPrimaryDark,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: kPrimary, foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 1,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          color: Colors.white,
        ),
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: kPrimary, foregroundColor: Colors.white,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: kBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: kBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: kPrimary, width: 2),
          ),
        ),
      ),
      home: const _AuthGate(),
    );
  }
}

// ─── Auth gate: muestra login o app según token ───────────────────────────────
class _AuthGate extends StatefulWidget {
  const _AuthGate();
  @override State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<AuthProvider>().checkAuth());
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return auth.isLoggedIn ? const MainShell() : const LoginPage();
  }
}

// ─── Shell principal con bottom nav ──────────────────────────────────────────
class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _idx = 0;

  static const _pages = [
    EmpleadosPage(),
    ProveedoresPage(),
    InsumosPage(),
    ComprasPage(),
    NominaPage(),
  ];

  static const _items = [
    BottomNavigationBarItem(icon: Icon(Icons.people_outlined), activeIcon: Icon(Icons.people), label: 'Empleados'),
    BottomNavigationBarItem(icon: Icon(Icons.business_outlined), activeIcon: Icon(Icons.business), label: 'Proveedores'),
    BottomNavigationBarItem(icon: Icon(Icons.inventory_2_outlined), activeIcon: Icon(Icons.inventory_2), label: 'Insumos'),
    BottomNavigationBarItem(icon: Icon(Icons.shopping_cart_outlined), activeIcon: Icon(Icons.shopping_cart), label: 'Compras'),
    BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: 'Control de Pagos'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: mainScaffoldKey,
      body: IndexedStack(index: _idx, children: _pages),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: kBorder, width: 1)),
        ),
        child: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: _idx,
          selectedItemColor: kPrimary,
          unselectedItemColor: kTextMuted,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          backgroundColor: Colors.white,
          elevation: 0,
          onTap: (i) => setState(() => _idx = i),
          items: _items,
        ),
      ),
      // Botón de cerrar sesión en drawer
      drawer: _drawer(context),
    );
  }

  Widget _drawer(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Drawer(
      child: Column(children: [
        DrawerHeader(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const CircleAvatar(
              radius: 28, backgroundColor: Colors.white24,
              child: Icon(Icons.person, color: Colors.white, size: 32),
            ),
            const SizedBox(height: 12),
            Text(auth.userName ?? 'Usuario',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
            if (auth.userRole?.isNotEmpty ?? false)
              Text(auth.userRole!, style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Text('MÓDULOS ADICIONALES',
            style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w700,
              color: Colors.grey.shade500, letterSpacing: 0.8)),
        ),
        ListTile(
          leading: const Icon(Icons.people_outline, color: kPrimary),
          title: const Text('Clientes'),
          onTap: () {
            Navigator.pop(context);
            Navigator.push(context,
              MaterialPageRoute(builder: (_) => const ClientesPage()));
          },
        ),
        ListTile(
          leading: const Icon(Icons.receipt_outlined, color: kPrimary),
          title: const Text('Pedidos / Ventas'),
          onTap: () {
            Navigator.pop(context);
            Navigator.push(context,
              MaterialPageRoute(builder: (_) => const VentasPage()));
          },
        ),
        const Spacer(),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.logout, color: kError),
          title: const Text('Cerrar sesión', style: TextStyle(color: kError)),
          onTap: () async {
            Navigator.pop(context);
            await context.read<AuthProvider>().logout();
          },
        ),
        const SizedBox(height: 20),
      ]),
    );
  }
}
