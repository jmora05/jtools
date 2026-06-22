import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/constants.dart';
import 'core/auth_provider.dart';
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
    if (auth.initializing) return const _AppLoadingScreen();
    return auth.isLoggedIn ? const MainShell() : const LoginPage();
  }
}

// ─── Pantalla de carga inicial ────────────────────────────────────────────────
class _AppLoadingScreen extends StatefulWidget {
  const _AppLoadingScreen();
  @override State<_AppLoadingScreen> createState() => _AppLoadingScreenState();
}

class _AppLoadingScreenState extends State<_AppLoadingScreen> {
  bool _showSlowMessage = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) setState(() => _showSlowMessage = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F2347),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96, height: 96,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(Icons.build_circle_outlined,
                color: Colors.white, size: 52),
            ),
            const SizedBox(height: 24),
            const Text('JTools',
              style: TextStyle(
                fontSize: 32, fontWeight: FontWeight.w800,
                color: Colors.white, letterSpacing: 0.5)),
            const SizedBox(height: 48),
            const CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
            const SizedBox(height: 20),
            AnimatedOpacity(
              opacity: _showSlowMessage ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 400),
              child: const Text(
                'Conectando con el servidor...',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
            ),
          ],
        ),
      ),
    );
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
    InsumosPage(),
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
      icon: Icon(Icons.inventory_2_outlined), activeIcon: Icon(Icons.inventory_2),
      label: 'Insumos'),
    BottomNavigationBarItem(
      icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long),
      label: 'Control de Pagos'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // ── Fade entre pestañas ──────────────────────────────────────────────────
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
    );
  }
}

