import 'dart:async';
import 'package:flutter/foundation.dart';

/// Pequeño helper para retrasar la ejecución de una acción hasta que el usuario
/// deje de escribir. Usado para validación de unicidad en tiempo real.
class Debouncer {
  final Duration delay;
  Timer? _timer;

  Debouncer({this.delay = const Duration(milliseconds: 450)});

  void run(VoidCallback action) {
    _timer?.cancel();
    _timer = Timer(delay, action);
  }

  void dispose() {
    _timer?.cancel();
  }
}
