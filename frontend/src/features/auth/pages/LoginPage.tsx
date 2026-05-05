import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import {
  EyeIcon, EyeOffIcon, CheckIcon, XIcon, UserPlusIcon, LogInIcon,
  MailIcon, LockIcon, AlertCircleIcon, BuildingIcon, UserIcon,
  ArrowLeftIcon, KeyIcon, ShieldCheckIcon, AlertTriangle,
} from 'lucide-react';
import * as authService from '@/features/auth/services/authService';
import { toast } from 'sonner';

type FieldErrors = Partial<Record<string, string>>;

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;

// ─── Componente auxiliar: error de campo (mismo estilo que ClientManagement) ──
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      {msg}
    </p>
  );
}

// ─── Componente auxiliar: cuenta regresiva ────────────────────────────────────
function CountdownTimer({ expiresAt, onExpire }: { expiresAt: Date; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return (
    <span className={remaining < 60 ? 'text-red-500 font-semibold' : 'text-blue-600 font-semibold'}>
      {mm}:{ss}
    </span>
  );
}

// ─── Validaciones ─────────────────────────────────────────────────────────────
function validateNameField(value: string, label: string): string {
  if (!value) return `${label} es obligatorio`;
  if (value !== value.trim()) return `${label} no debe tener espacios al inicio o al final`;
  if (value.trim().length < 2) return `${label} debe tener al menos 2 caracteres`;
  if (value.trim().length > 100) return `${label} no puede superar 100 caracteres`;
  if (!NAME_REGEX.test(value)) return `${label} solo puede contener letras y espacios`;
  if (/^\s+$/.test(value)) return `${label} no puede ser solo espacios`;
  return '';
}

function validateDocumentNumber(value: string): string {
  if (!value) return 'El número de documento es obligatorio';
  if (/\s/.test(value)) return 'El número de documento no puede contener espacios';
  if (!/^[a-zA-Z0-9]{4,20}$/.test(value)) return 'Entre 4 y 20 caracteres alfanuméricos';
  return '';
}

function validatePhone(value: string): string {
  if (!value) return 'El teléfono es obligatorio';
  if (!/^\+?[\d\s\-]{7,20}$/.test(value)) return 'Formato no válido (7-20 dígitos)';
  return '';
}

function validateEmail(value: string): string {
  if (!value) return 'El correo electrónico es obligatorio';
  if (value !== value.trim()) return 'El correo no debe tener espacios';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Correo electrónico inválido';
  return '';
}

function validateCity(value: string): string {
  if (!value) return 'La ciudad es obligatoria';
  if (value.trim().length < 2) return 'Mínimo 2 caracteres';
  if (value.trim().length > 100) return 'Máximo 100 caracteres';
  if (!NAME_REGEX.test(value)) return 'Solo letras y espacios';
  return '';
}

function validateAddress(value: string): string {
  if (value && value.length > 200) return 'La dirección no puede superar 200 caracteres';
  return '';
}

function validatePassword(value: string): string {
  if (!value) return 'La contraseña es obligatoria';
  if (value.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(value)) return 'Al menos 1 mayúscula';
  if ((value.match(/\d/g) || []).length < 2) return 'Al menos 2 números';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Al menos 1 carácter especial';
  return '';
}

function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return 'Confirma tu contraseña';
  if (password !== confirm) return 'Las contraseñas no coinciden';
  return '';
}

// ─── Helpers de input (igual que ClientManagement) ────────────────────────────
const onlyLetters  = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
const onlyPhone    = (v: string) => v.replace(/[^\d+\s\-]/g, '');
const noSpaces     = (v: string) => v.replace(/\s/g, '');

// ─────────────────────────────────────────────────────────────────────────────
export function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Password recovery states
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryStep, setRecoveryStep]   = useState(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [codeExpiry, setCodeExpiry]           = useState<Date | null>(null);
  const [resetToken, setResetToken]           = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [resendCooldown, setResendCooldown]   = useState(0);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    contacto: '',           // ← añadido para persona de contacto (Empresa)
    documentType: 'CC',
    documentNumber: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    personType: 'natural',
    password: '',
    confirmPassword: '',
  });

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    length: false, uppercase: false, numbers: false, special: false,
  });
  const [newPasswordValidation, setNewPasswordValidation] = useState({
    length: false, uppercase: false, numbers: false, special: false,
  });

  useEffect(() => {
    const p = registerForm.password;
    setPasswordValidation({
      length:    p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      numbers:   (p.match(/\d/g) || []).length >= 2,
      special:   /[!@#$%^&*(),.?":{}|<>]/.test(p),
    });
  }, [registerForm.password]);

  useEffect(() => {
    setNewPasswordValidation({
      length:    newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      numbers:   (newPassword.match(/\d/g) || []).length >= 2,
      special:   /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  // Revalidar en tiempo real cuando el usuario ya intentó enviar
  useEffect(() => {
    if (!submitAttempted) return;
    const errors: FieldErrors = {};
    if (registerForm.personType === 'natural') {
      errors.firstName = validateNameField(registerForm.firstName, 'El nombre');
      errors.lastName  = validateNameField(registerForm.lastName, 'Los apellidos');
    } else {
      errors.businessName = validateNameField(registerForm.businessName, 'La razón social');
      if (!registerForm.contacto.trim()) errors.contacto = 'El contacto es obligatorio';
    }
    errors.documentNumber  = validateDocumentNumber(registerForm.documentNumber);
    errors.phone           = validatePhone(registerForm.phone);
    errors.email           = validateEmail(registerForm.email);
    errors.city            = validateCity(registerForm.city);
    errors.address         = validateAddress(registerForm.address);
    errors.password        = validatePassword(registerForm.password);
    errors.confirmPassword = validateConfirmPassword(registerForm.password, registerForm.confirmPassword);
    setFieldErrors(errors);
  }, [registerForm, submitAttempted]);

  const isPasswordValid = () => Object.values(passwordValidation).every(Boolean);
  const isNewPasswordValid = () => Object.values(newPasswordValidation).every(Boolean);

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: msg }));

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const resp = await authService.login(loginForm.email, loginForm.password);
      localStorage.setItem('jrepuestos_token', resp.token);
      const rawUserType = (resp.usuario as any).userType as string | undefined;
      const userType: 'admin' | 'client' = rawUserType === 'client' ? 'client' : 'admin';
      onLogin({
        id: resp.usuario.id,
        email: resp.usuario.email,
        rolesId: resp.usuario.rolesId,
        userType,
        role: (resp.usuario as any).rolName || (userType === 'admin' ? 'Administrador' : 'Cliente'),
        name: resp.usuario.email,
      });
      toast.success(resp.message || 'Inicio de sesión exitoso');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const errors: FieldErrors = {};
    if (registerForm.personType === 'natural') {
      errors.firstName = validateNameField(registerForm.firstName, 'El nombre');
      errors.lastName  = validateNameField(registerForm.lastName, 'Los apellidos');
    } else {
      errors.businessName = validateNameField(registerForm.businessName, 'La razón social');
      if (!registerForm.contacto.trim()) errors.contacto = 'El contacto es obligatorio';
    }
    errors.documentNumber  = validateDocumentNumber(registerForm.documentNumber);
    errors.phone           = validatePhone(registerForm.phone);
    errors.email           = validateEmail(registerForm.email);
    errors.city            = validateCity(registerForm.city);
    errors.address         = validateAddress(registerForm.address);
    errors.password        = validatePassword(registerForm.password);
    errors.confirmPassword = validateConfirmPassword(registerForm.password, registerForm.confirmPassword);

    setFieldErrors(errors);
    if (Object.values(errors).some(v => v && v.length > 0)) {
      toast.error('Por favor corrige los errores antes de continuar');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        email:            registerForm.email,
        password:         registerForm.password,
        nombres:          registerForm.personType === 'natural' ? registerForm.firstName  : 'N/A',
        apellidos:        registerForm.personType === 'natural' ? registerForm.lastName   : 'N/A',
        razon_social:     registerForm.personType === 'empresa' ? registerForm.businessName : '',
        tipo_documento:   registerForm.documentType,
        numero_documento: registerForm.documentNumber,
        telefono:         registerForm.phone,
        ciudad:           registerForm.city,
        direccion:        registerForm.address || undefined,
        ...(registerForm.personType === 'empresa' ? { contacto: registerForm.contacto } : {}),
      });
      toast.success('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
      setActiveTab('login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperación de contraseña ─────────────────────────────────────────────
  const handleForgotPassword = () => {
    setIsRecoveryModalOpen(true);
    setRecoveryStep(1);
    setRecoveryEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCodeExpiry(null);
    setResetToken('');
    setRemainingAttempts(5);
    setResendCooldown(0);
  };

  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) { toast.error('El correo electrónico es obligatorio'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) { toast.error('Ingresa un correo válido'); return; }
    setLoading(true);
    try {
      const resp = await authService.forgotPassword(recoveryEmail);
      setCodeExpiry(new Date(Date.now() + 10 * 60 * 1000));
      setRemainingAttempts(5);
      setResendCooldown(60);
      setRecoveryStep(2);
      if (resp.devCode) toast.info(`[DEV] Código: ${resp.devCode}`);
      else toast.success(resp.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }
    if (codeExpiry && new Date() > codeExpiry) {
      toast.error('El código ha expirado. Solicita uno nuevo.');
      setRecoveryStep(1);
      return;
    }
    setLoading(true);
    try {
      const resp = await authService.verifyCode(recoveryEmail, verificationCode);
      if (resp.resetToken) {
        setResetToken(resp.resetToken);
        setRecoveryStep(3);
        toast.success('Código verificado. Ahora crea tu nueva contraseña.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Código inválido';
      toast.error(msg);
      const match = msg.match(/(\d+) intento/);
      if (match) setRemainingAttempts(Number(match[1]));
      else setRemainingAttempts(prev => Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) { toast.error('Todos los campos son obligatorios'); return; }
    if (!isNewPasswordValid()) { toast.error('La contraseña no cumple los requisitos de seguridad'); return; }
    if (newPassword !== confirmNewPassword) { toast.error('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(resetToken, newPassword);
      setRecoveryStep(4);
      toast.success('Contraseña restablecida exitosamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setLoading(true);
    authService.resendCode(recoveryEmail)
      .then((resp) => {
        setCodeExpiry(new Date(Date.now() + 10 * 60 * 1000));
        setRemainingAttempts(5);
        setResendCooldown(60);
        setVerificationCode('');
        if (resp.devCode) toast.info(`[DEV] Nuevo código: ${resp.devCode}`);
        else toast.success(resp.message);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al reenviar código'))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const resetForms = () => {
    setLoginForm({ email: '', password: '' });
    setRegisterForm({
      email: '', firstName: '', lastName: '', businessName: '', contacto: '',
      phone: '', password: '', confirmPassword: '', address: '',
      city: '', personType: 'natural', documentType: 'CC', documentNumber: '',
    });
    setFieldErrors({});
    setSubmitAttempted(false);
  };

  const getValidationIcon = (isValid: boolean) =>
    isValid
      ? <CheckIcon className="w-3 h-3 text-green-500" />
      : <XIcon className="w-3 h-3 text-red-500" />;

  const closeRecoveryModal = () => {
    setIsRecoveryModalOpen(false);
    setRecoveryStep(1);
    setRecoveryEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCodeExpiry(null);
    setResetToken('');
    setRemainingAttempts(5);
    setResendCooldown(0);
  };

  // Documentos disponibles según tipo de persona
  const docsNatural = [
    { value: 'CC',        label: 'Cédula de Ciudadanía' },
    { value: 'CE',        label: 'Cédula de Extranjería' },
    { value: 'Pasaporte', label: 'Pasaporte'             },
  ];
  const docsEmpresa = [
    { value: 'RUT', label: 'RUT' },
    { value: 'NIT', label: 'NIT' },
  ];
  const docsDisponibles = registerForm.personType === 'natural' ? docsNatural : docsEmpresa;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-4">
      <div className={`w-full ${activeTab === 'register' ? 'max-w-2xl' : 'max-w-md'} transition-all duration-300`}>

        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xl">
            <span className="text-white text-2xl font-bold">J</span>
          </div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">Jrepuestos Medellín</h1>
          <p className="text-sm text-gray-600">Sistema de Gestión</p>
        </div>

        <Card className="shadow-2xl border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <Tabs value={activeTab} onValueChange={(value: string) => { setActiveTab(value); resetForms(); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2 text-sm">
                  <LogInIcon className="w-4 h-4" />Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2 text-sm">
                  <UserPlusIcon className="w-4 h-4" />Registrarse
                </TabsTrigger>
              </TabsList>

              {/* ═══════════════════════════════════════════════════════════════
                  PESTAÑA LOGIN
              ════════════════════════════════════════════════════════════════ */}
              <TabsContent value="login" className="space-y-4 mt-4">
                <div className="text-center">
                  <CardTitle className="text-lg">Bienvenido de vuelta</CardTitle>
                  <CardDescription className="text-sm">Ingresa tus credenciales para continuar</CardDescription>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm">
                      Correo electrónico <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        placeholder="tu@correo.com"
                        className="pl-10 h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm">
                      Contraseña <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-9">
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Iniciando sesión...</>
                      : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════════════
                  PESTAÑA REGISTRO — estructura idéntica al formulario de Clientes
              ════════════════════════════════════════════════════════════════ */}
              <TabsContent value="register" className="space-y-3 mt-4">
                <div className="text-center">
                  <CardTitle className="text-lg">Crear nueva cuenta</CardTitle>
                  <CardDescription className="text-sm">
                    Completa la información para registrarte. Los campos con <span className="text-red-500">*</span> son obligatorios.
                  </CardDescription>
                </div>

                <form onSubmit={handleRegister} noValidate className="space-y-5">

                  {/* ── 1. Tipo de persona ─────────────────────────────────── */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Tipo de persona <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={registerForm.personType}
                      onValueChange={(value: string) =>
                        setRegisterForm({
                          ...registerForm,
                          personType:     value,
                          documentType:   value === 'natural' ? 'CC' : 'RUT',
                          documentNumber: '',
                          firstName:      '',
                          lastName:       '',
                          businessName:   '',
                          contacto:       '',
                        })
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                        <SelectContent position="popper" side="bottom" align="start" sideOffset={4} avoidCollisions={false} className="z-[200] w-[--radix-select-trigger-width]">
                        <SelectItem value="natural">
                          <div className="flex items-center gap-2"><UserIcon className="w-4 h-4" />Persona Natural</div>
                        </SelectItem>
                        <SelectItem value="empresa">
                          <div className="flex items-center gap-2"><BuildingIcon className="w-4 h-4" />Empresa</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ── 2. Tipo de documento + Número (grid 2 col) ────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Tipo de documento <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={registerForm.documentType}
                        onValueChange={(value: string) =>
                          setRegisterForm({ ...registerForm, documentType: value, documentNumber: '' })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent position="popper" side="bottom" align="start" sideOffset={4} avoidCollisions={false} className="z-[200] w-[--radix-select-trigger-width]">
                          {docsDisponibles.map(doc => (
                            <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Número de documento <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={registerForm.documentNumber}
                        onChange={(e) => {
                          setRegisterForm({ ...registerForm, documentNumber: e.target.value });
                          setFieldError('documentNumber', '');
                        }}
                        onBlur={() => setFieldError('documentNumber', validateDocumentNumber(registerForm.documentNumber))}
                        maxLength={20}
                        placeholder={registerForm.personType === 'empresa' ? '900123456-7' : '1234567890'}
                        className={fieldErrors.documentNumber ? 'border-red-400 focus-visible:ring-red-300' : ''}
                      />
                      <FieldError msg={fieldErrors.documentNumber} />
                    </div>
                  </div>

                  {/* ── 3a. Persona natural → Nombres + Apellidos ─────────── */}
                  {registerForm.personType === 'natural' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Nombres <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={registerForm.firstName}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, firstName: onlyLetters(e.target.value) });
                            setFieldError('firstName', '');
                          }}
                          onBlur={() => setFieldError('firstName', validateNameField(registerForm.firstName, 'El nombre'))}
                          maxLength={50}
                          placeholder="Ej: Juan"
                          className={fieldErrors.firstName ? 'border-red-400 focus-visible:ring-red-300' : ''}
                        />
                        <FieldError msg={fieldErrors.firstName} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Apellidos <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={registerForm.lastName}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, lastName: onlyLetters(e.target.value) });
                            setFieldError('lastName', '');
                          }}
                          onBlur={() => setFieldError('lastName', validateNameField(registerForm.lastName, 'Los apellidos'))}
                          maxLength={50}
                          placeholder="Ej: Pérez Gómez"
                          className={fieldErrors.lastName ? 'border-red-400 focus-visible:ring-red-300' : ''}
                        />
                        <FieldError msg={fieldErrors.lastName} />
                      </div>
                    </div>
                  ) : (
                    /* ── 3b. Empresa → Razón Social + Persona de contacto ── */
                    <>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Razón Social <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={registerForm.businessName}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, businessName: e.target.value.slice(0, 100) });
                            setFieldError('businessName', '');
                          }}
                          onBlur={() => setFieldError('businessName', validateNameField(registerForm.businessName, 'La razón social'))}
                          maxLength={100}
                          placeholder="Ej: Auto Servicio López S.A.S"
                          className={fieldErrors.businessName ? 'border-red-400 focus-visible:ring-red-300' : ''}
                        />
                        <FieldError msg={fieldErrors.businessName} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Persona de contacto <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={registerForm.contacto}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, contacto: onlyLetters(e.target.value) });
                            setFieldError('contacto', '');
                          }}
                          onBlur={() => {
                            if (!registerForm.contacto.trim()) setFieldError('contacto', 'El contacto es obligatorio');
                          }}
                          maxLength={100}
                          placeholder="Ej: María García"
                          className={fieldErrors.contacto ? 'border-red-400 focus-visible:ring-red-300' : ''}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Nombre del representante o contacto principal de la empresa
                        </p>
                        <FieldError msg={fieldErrors.contacto} />
                      </div>
                    </>
                  )}

                  {/* ── 4. Correo electrónico ─────────────────────────────── */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, email: noSpaces(e.target.value) });
                        setFieldError('email', '');
                      }}
                      onBlur={() => setFieldError('email', validateEmail(registerForm.email))}
                      maxLength={100}
                      placeholder="tu@correo.com"
                      className={fieldErrors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}
                    />
                    <FieldError msg={fieldErrors.email} />
                  </div>

                  {/* ── 5. Teléfono + Ciudad (grid 2 col) ────────────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        value={registerForm.phone}
                        onChange={(e) => {
                          setRegisterForm({ ...registerForm, phone: onlyPhone(e.target.value) });
                          setFieldError('phone', '');
                        }}
                        onBlur={() => setFieldError('phone', validatePhone(registerForm.phone))}
                        maxLength={20}
                        placeholder="+57 300 123 4567"
                        className={fieldErrors.phone ? 'border-red-400 focus-visible:ring-red-300' : ''}
                      />
                      <FieldError msg={fieldErrors.phone} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Ciudad <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={registerForm.city}
                        onChange={(e) => {
                          setRegisterForm({ ...registerForm, city: onlyLetters(e.target.value) });
                          setFieldError('city', '');
                        }}
                        onBlur={() => setFieldError('city', validateCity(registerForm.city))}
                        maxLength={50}
                        placeholder="Medellín"
                        className={fieldErrors.city ? 'border-red-400 focus-visible:ring-red-300' : ''}
                      />
                      <FieldError msg={fieldErrors.city} />
                    </div>
                  </div>

                  {/* ── 6. Dirección ──────────────────────────────────────── */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Dirección</label>
                    <Input
                      value={registerForm.address}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, address: e.target.value });
                        setFieldError('address', '');
                      }}
                      onBlur={() => setFieldError('address', validateAddress(registerForm.address))}
                      maxLength={200}
                      placeholder="Calle 123 #45-67"
                      className={fieldErrors.address ? 'border-red-400 focus-visible:ring-red-300' : ''}
                    />
                    <FieldError msg={fieldErrors.address} />
                  </div>

                  {/* ── 7. Contraseña + Confirmar (grid 2 col) ───────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Contraseña <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={registerForm.password}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, password: e.target.value });
                            setFieldError('password', '');
                          }}
                          onBlur={() => setFieldError('password', validatePassword(registerForm.password))}
                          placeholder="••••••••"
                          className={`pr-10 ${fieldErrors.password ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <FieldError msg={fieldErrors.password} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Confirmar contraseña <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={registerForm.confirmPassword}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, confirmPassword: e.target.value });
                            setFieldError('confirmPassword', '');
                          }}
                          onBlur={() =>
                            setFieldError('confirmPassword',
                              validateConfirmPassword(registerForm.password, registerForm.confirmPassword))
                          }
                          placeholder="••••••••"
                          className={`pr-10 ${fieldErrors.confirmPassword ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <FieldError msg={fieldErrors.confirmPassword} />
                    </div>
                  </div>

                  {/* ── 8. Indicador de fortaleza de contraseña ───────────── */}
                  {registerForm.password && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-2">Requisitos de la contraseña:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { ok: passwordValidation.length,    label: 'Mínimo 8 caracteres' },
                          { ok: passwordValidation.uppercase, label: '1 mayúscula'          },
                          { ok: passwordValidation.numbers,   label: '2 números'            },
                          { ok: passwordValidation.special,   label: '1 especial (!@#$)'    },
                        ].map(({ ok, label }) => (
                          <div key={label} className="flex items-center gap-2 text-xs">
                            {getValidationIcon(ok)}
                            <span className={ok ? 'text-green-600' : 'text-red-500'}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── 9. Botón submit ───────────────────────────────────── */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setActiveTab('login'); resetForms(); }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !isPasswordValid() || registerForm.password !== registerForm.confirmPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Creando cuenta...</>
                        : 'Crear Cuenta'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL RECUPERACIÓN DE CONTRASEÑA — 4 pasos
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isRecoveryModalOpen} onOpenChange={closeRecoveryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyIcon className="w-5 h-5 text-blue-600" />Recuperar Contraseña
            </DialogTitle>
            <DialogDescription>
              {recoveryStep === 1 && 'Te enviaremos un código de verificación a tu correo electrónico'}
              {recoveryStep === 2 && 'Ingresa el código de verificación que enviamos a tu correo'}
              {recoveryStep === 3 && 'Crea una nueva contraseña segura'}
              {recoveryStep === 4 && 'Tu contraseña ha sido restablecida exitosamente'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">

            {/* Step 1 — Ingresar email */}
            {recoveryStep === 1 && (
              <form onSubmit={handleSendRecoveryEmail} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm text-gray-700 mb-1">
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="pl-10 h-9"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Debe ser el correo asociado a tu cuenta</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeRecoveryModal} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Enviando...</>
                      : 'Enviar Código'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2 — Verificar OTP */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Código enviado a: <span className="font-semibold">{recoveryEmail}</span>
                  </p>
                  {codeExpiry && (
                    <p className="text-xs text-gray-500 mt-1">
                      Expira en:{' '}
                      <CountdownTimer
                        expiresAt={codeExpiry}
                        onExpire={() => { toast.error('El código expiró. Solicita uno nuevo.'); setRecoveryStep(1); }}
                      />
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-gray-700 mb-1">
                    Código de verificación <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="h-11 text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500">Ingresa el código de 6 dígitos que recibiste por email</p>
                </div>

                {remainingAttempts < 5 && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg
                    ${remainingAttempts <= 1 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
                    {remainingAttempts === 0
                      ? 'Sin intentos restantes. Solicita un nuevo código.'
                      : `Te quedan ${remainingAttempts} intento(s).`}
                  </div>
                )}

                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-gray-400">
                      Reenviar código en <span className="font-semibold text-gray-600">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                    >
                      ¿No recibiste el código? Reenviar
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setRecoveryStep(1)} className="flex-1">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />Atrás
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || remainingAttempts === 0 || verificationCode.length !== 6}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Verificando...</>
                      : 'Verificar'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3 — Nueva contraseña */}
            {recoveryStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Nueva contraseña <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10 h-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Confirmar nueva contraseña <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`pr-10 h-9 ${confirmNewPassword && newPassword !== confirmNewPassword ? 'border-red-500' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircleIcon className="w-3 h-3" />Las contraseñas no coinciden
                      </p>
                    )}
                  </div>
                </div>

                {newPassword && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-2">Requisitos de la contraseña:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { ok: newPasswordValidation.length,    label: 'Mínimo 8 caracteres' },
                        { ok: newPasswordValidation.uppercase, label: '1 mayúscula'          },
                        { ok: newPasswordValidation.numbers,   label: '2 números'            },
                        { ok: newPasswordValidation.special,   label: '1 especial (!@#$)'    },
                      ].map(({ ok, label }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          {getValidationIcon(ok)}
                          <span className={ok ? 'text-green-600' : 'text-red-500'}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setRecoveryStep(2)} className="flex-1">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />Atrás
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !isNewPasswordValid() || newPassword !== confirmNewPassword}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Guardando...</>
                      : 'Cambiar Contraseña'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4 — Éxito */}
            {recoveryStep === 4 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¡Contraseña restablecida!</h3>
                  <p className="text-sm text-gray-600">
                    Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                  </p>
                </div>
                <Button onClick={closeRecoveryModal} className="w-full bg-blue-600 hover:bg-blue-700">
                  Ir a Iniciar Sesión
                </Button>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
