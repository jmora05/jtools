import 'package:flutter/material.dart';

// ─── API ──────────────────────────────────────────────────────────────────────
const String kBaseUrl = 'https://jtools-backend.onrender.com/api';

// ─── Colores ─────────────────────────────────────────────────────────────────
const Color kPrimary      = Color(0xFF1D4ED8); // blue-700
const Color kPrimaryLight = Color(0xFF3B82F6); // blue-500
const Color kPrimaryDark  = Color(0xFF1E3A8A); // blue-900
const Color kBg           = Color(0xFFF8FAFC); // slate-50
const Color kError        = Color(0xFFDC2626); // red-600 — solo en acciones destructivas (Eliminar)
const Color kText         = Color(0xFF0F172A); // slate-900
const Color kTextMuted    = Color(0xFF64748B); // slate-500
const Color kBorder       = Color(0xFFE2E8F0); // slate-200
const Color kChipBg       = Color(0xFFDBEAFE); // blue-100
const Color kChipText     = Color(0xFF1E3A8A); // blue-900
// kWarning (amber) reemplazado por kTextMuted — alias temporal para compatibilidad
const Color kWarning      = Color(0xFF64748B); // → kTextMuted

// ─── Estilos de texto ─────────────────────────────────────────────────────────
const TextStyle kTitle = TextStyle(
  fontSize: 22, fontWeight: FontWeight.w800, color: kText,
);
const TextStyle kSubtitle = TextStyle(
  fontSize: 14, color: kTextMuted,
);
const TextStyle kLabel = TextStyle(
  fontSize: 11, fontWeight: FontWeight.w700, color: kTextMuted,
  letterSpacing: 0.6,
);

// ─── Colores de estado — solo azul, gris y blanco ─────────────────────────────
class EstadoColors {
  const EstadoColors._();

  static Color bg(String estado) {
    switch (estado) {
      case 'pendiente':    return const Color(0xFFF1F5F9); // slate-100
      case 'completada':   return kChipBg;
      case 'pagado':       return kChipBg;
      case 'anulada':      return const Color(0xFFFEE2E2); // red-100
      case 'en transito':  return kChipBg;
      case 'disponible':   return kChipBg;
      case 'agotado':      return const Color(0xFFF1F5F9);
      case 'activo':       return kChipBg;
      case 'inactivo':     return const Color(0xFFF1F5F9);
      default:             return const Color(0xFFF3F4F6);
    }
  }

  static Color text(String estado) {
    switch (estado) {
      case 'pendiente':    return kTextMuted;
      case 'completada':   return kPrimaryDark;
      case 'pagado':       return kPrimaryDark;
      case 'anulada':      return const Color(0xFF7F1D1D); // red-900
      case 'en transito':  return kPrimary;
      case 'disponible':   return kPrimaryDark;
      case 'agotado':      return kTextMuted;
      case 'activo':       return kPrimaryDark;
      case 'inactivo':     return const Color(0xFF475569); // slate-600
      default:             return const Color(0xFF374151);
    }
  }

  static String label(String estado) {
    const map = {
      'pendiente':   'Pendiente',
      'completada':  'Completada',
      'pagado':      'Pagado',
      'anulada':     'Anulada',
      'en transito': 'En tránsito',
      'disponible':  'Disponible',
      'agotado':     'Agotado',
      'activo':      'Activo',
      'inactivo':    'Inactivo',
    };
    return map[estado] ?? estado;
  }
}

Widget estadoChip(String estado, {String? customLabel}) {
  final bg  = EstadoColors.bg(estado);
  final fg  = EstadoColors.text(estado);
  final lbl = customLabel ?? EstadoColors.label(estado);
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: fg.withValues(alpha: 0.4)),
    ),
    child: Text(lbl, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w600)),
  );
}

// ─── Animación escalonada de ítems de lista ───────────────────────────────────
class AnimatedListItem extends StatefulWidget {
  final int index;
  final Widget child;
  const AnimatedListItem({super.key, required this.index, required this.child});
  @override State<AnimatedListItem> createState() => _AnimatedListItemState();
}

class _AnimatedListItemState extends State<AnimatedListItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 280));
    final delay = Duration(milliseconds: (widget.index * 48).clamp(0, 280));
    Future.delayed(delay, () { if (mounted) _ctrl.forward(); });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _ctrl,
    builder: (_, __) {
      final v = Curves.easeOut.transform(_ctrl.value);
      return Opacity(
        opacity: v,
        child: Transform.translate(
          offset: Offset(0, 14 * (1 - v)),
          child: widget.child,
        ),
      );
    },
  );
}

// ─── Error de campo (validación en tiempo real, igual que la web) ─────────────
/// Muestra un mensaje de error rojo debajo de un campo, igual que la web.
Widget fieldError(String? msg) {
  if (msg == null || msg.isEmpty) return const SizedBox.shrink();
  return Padding(
    padding: const EdgeInsets.only(left: 4, top: 4),
    child: Text(msg, style: const TextStyle(color: kError, fontSize: 12)),
  );
}

// ─── Decoración de inputs ─────────────────────────────────────────────────────
InputDecoration kInputDeco(String label, {String? hint, Widget? prefix}) =>
    InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: prefix,
      labelStyle: const TextStyle(color: kTextMuted, fontSize: 14),
      floatingLabelStyle: const TextStyle(color: kPrimary, fontSize: 12),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: kError),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: kError, width: 2),
      ),
      filled: true,
      fillColor: Colors.white,
    );
