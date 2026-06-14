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

import 'insumos/insumo_provider.dart'; // Requerido por ComprasPage

import 'compras/compra_provider.dart';
import 'compras/compras_page.dart';

import 'nomina/nomina_provider.dart';
import 'nomina/nomina_page.dart';

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
        pageTransitionsTheme: const PageTransitionsTheme(
          builders: {
            TargetPlatform.android: ZoomPageTransitionsBuilder(),
            TargetPlatform.iOS:     CupertinoPageTransitionsBuilder(),
          },
        ),
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

// ─── Auth gate ────────────────────────────────────────────────────────────────
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

// ─── Shell principal ──────────────────────────────────────────────────────────
class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _idx = 0;

  static const _pages = [
    EmpleadosPage(),
    ProveedoresPage(),
    ComprasPage(),
    NominaPage(),
  ];

  static const _items = [
    BottomNavigationBarItem(
      icon: Icon(Icons.people_outlined), activeIcon: Icon(Icons.people),
      label: 'Empleados'),
    BottomNavigationBarItem(
      icon: Icon(Icons.business_outlined), activeIcon: Icon(Icons.business),
      label: 'Proveedores'),
    BottomNavigationBarItem(
      icon: Icon(Icons.shopping_cart_outlined), activeIcon: Icon(Icons.shopping_cart),
      label: 'Compras'),
    BottomNavigationBarItem(
      icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long),
      label: 'Control de Pagos'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: mainScaffoldKey,
      // ── Fade entre pestañas ────────────────────────────────────────────────
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        transitionBuilder: (child, animation) => FadeTransition(
          opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
          child: child,
        ),
        child: KeyedSubtree(key: ValueKey(_idx), child: _pages[_idx]),
      ),
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
      drawer: _drawer(context),
    );
  }

  Widget _drawer(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(children: [
          // ── Header minimalista ─────────────────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
            color: kPrimaryDark,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person_outline, color: Colors.white, size: 28),
              ),
              const SizedBox(height: 16),
              Text(
                auth.userName ?? 'Usuario',
                style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
              ),
              if (auth.userRole?.isNotEmpty ?? false) ...[
                const SizedBox(height: 3),
                Text(auth.userRole!,
                  style: const TextStyle(color: Colors.white60, fontSize: 13)),
              ],
            ]),
          ),
          const Spacer(),
          const Divider(height: 1),
          // ── Cerrar sesión ──────────────────────────────────────────────────
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            leading: Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: kTextMuted.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.logout, color: kTextMuted, size: 20),
            ),
            title: const Text('Cerrar sesión',
              style: TextStyle(color: kTextMuted, fontWeight: FontWeight.w600, fontSize: 15)),
            onTap: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  title: const Text('Cerrar sesión',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                  content: const Text('¿Seguro que deseas cerrar tu sesión?',
                    style: TextStyle(fontSize: 14)),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancelar',
                        style: TextStyle(color: kTextMuted)),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimary, foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Cerrar sesión'),
                    ),
                  ],
                ),
              );
              if (ok != true || !context.mounted) return;
              Navigator.pop(context);
              await context.read<AuthProvider>().logout();
            },
          ),
          const SizedBox(height: 12),
        ]),
      ),
    );
  }
}
