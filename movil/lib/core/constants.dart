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
