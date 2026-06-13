import 'package:flutter/material.dart';

// ─── API ──────────────────────────────────────────────────────────────────────
// Cambia esta URL según donde corras la app:
//   Flutter web / mismo PC  → http://localhost:5000/api
//   Emulador Android        → http://10.0.2.2:5000/api
//   Dispositivo físico      → http://192.168.X.X:5000/api (IP de tu PC)
const String kBaseUrl = 'http://localhost:5000/api';

// ─── Colores ─────────────────────────────────────────────────────────────────
const Color kPrimary      = Color(0xFF1D4ED8); // blue-700
const Color kPrimaryLight = Color(0xFF3B82F6); // blue-500
const Color kPrimaryDark  = Color(0xFF1E3A8A); // blue-900
const Color kBg           = Color(0xFFF8FAFC); // slate-50
const Color kError        = Color(0xFFDC2626); // red-600
const Color kWarning      = Color(0xFFD97706); // amber-600
const Color kText         = Color(0xFF0F172A); // slate-900
const Color kTextMuted    = Color(0xFF64748B); // slate-500
const Color kBorder       = Color(0xFFE2E8F0); // slate-200
const Color kChipBg       = Color(0xFFDBEAFE); // blue-100
const Color kChipText     = Color(0xFF1E3A8A); // blue-900

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

// ─── Colores de estado ────────────────────────────────────────────────────────
class EstadoColors {
  const EstadoColors._();

  static Color bg(String estado) {
    switch (estado) {
      case 'pendiente':    return const Color(0xFFFEF9C3);
      case 'completada':   return const Color(0xFFCCFBF1);
      case 'anulada':      return const Color(0xFFFEE2E2);
      case 'en transito':  return const Color(0xFFDBEAFE);
      case 'disponible':   return const Color(0xFFDCFCE7);
      case 'agotado':      return const Color(0xFFF3F4F6);
      case 'activo':       return const Color(0xFFDBEAFE);
      case 'inactivo':     return const Color(0xFFF1F5F9);
      default:             return const Color(0xFFF3F4F6);
    }
  }

  static Color text(String estado) {
    switch (estado) {
      case 'pendiente':    return const Color(0xFF92400E);
      case 'completada':   return const Color(0xFF0F766E);
      case 'anulada':      return const Color(0xFF7F1D1D);
      case 'en transito':  return const Color(0xFF1E3A8A);
      case 'disponible':   return const Color(0xFF166634);
      case 'agotado':      return const Color(0xFF374151);
      case 'activo':       return const Color(0xFF1E3A8A);
      case 'inactivo':     return const Color(0xFF475569);
      default:             return const Color(0xFF374151);
    }
  }

  static String label(String estado) {
    const map = {
      'pendiente':   'Pendiente',
      'completada':  'Completada',
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
  final bg   = EstadoColors.bg(estado);
  final fg   = EstadoColors.text(estado);
  final lbl  = customLabel ?? EstadoColors.label(estado);
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: fg.withOpacity(0.4)),
    ),
    child: Text(lbl, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w600)),
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
