import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  XIcon,
  UserPlusIcon,
  LogInIcon,
  MailIcon,
  LockIcon,
  AlertCircleIcon,
  BuildingIcon,
  UserIcon,
  ArrowLeftIcon,
  KeyIcon,
  ShieldCheckIcon
} from 'lucide-react';
import * as authService from '@/features/auth/services/authService';
import { toast } from 'sonner';

type FieldErrors = Partial<Record<string, string>>;

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÁÁ“ÁšñÁ‘Á¼Áœ\s]+$/;

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
  if (!/^[a-zA-Z0-9]{4,20}$/.test(value)) return 'El número de documento debe tener entre 4 y 20 caracteres alfanuméricos';
  return '';
}

function validatePhone(value: string): string {
  if (!value) return 'El teléfono es obligatorio';
  if (!/^\+?[\d\s\-]{7,20}$/.test(value)) return 'El teléfono no tiene un formato válido (7-20 dígitos)';
  return '';
}

function validateEmail(value: string): string {
  if (!value) return 'El correo electrónico es obligatorio';
  if (value !== value.trim()) return 'El correo no debe tener espacios al inicio o al final';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un correo electrónico válido';
  return '';
}

function validateCity(value: string): string {
  if (!value) return 'La ciudad es obligatoria';
  if (value.trim().length < 2) return 'La ciudad debe tener al menos 2 caracteres';
  if (value.trim().length > 100) return 'La ciudad no puede superar 100 caracteres';
  if (!NAME_REGEX.test(value)) return 'La ciudad solo puede contener letras y espacios';
  return '';
}

function validateAddress(value: string): string {
  if (value && value.length > 200) return 'La dirección no puede superar 200 caracteres';
  return '';
}

function validatePassword(value: string): string {
  if (!value) return 'La contraseña es obligatoria';
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(value)) return 'La contraseña debe tener al menos 1 mayúscula';
  if ((value.match(/\d/g) || []).length < 2) return 'La contraseña debe tener al menos 2 números';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'La contraseña debe tener al menos 1 carácter especial';
  return '';
}

function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return 'Confirma tu contraseña';
  if (password !== confirm) return 'Las contraseñas no coinciden';
  return '';
}

export function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Password recovery states
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
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
    length: false,
    uppercase: false,
    numbers: false,
    special: false,
  });

  // New password validation for recovery
  const [newPasswordValidation, setNewPasswordValidation] = useState({
    length: false,
    uppercase: false,
    numbers: false,
    special: false,
  });

  useEffect(() => {
    const p = registerForm.password;
    setPasswordValidation({
      length: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      numbers: (p.match(/\d/g) || []).length >= 2,
      special: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    });
  }, [registerForm.password]);

  useEffect(() => {
    setNewPasswordValidation({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      numbers: (newPassword.match(/\d/g) || []).length >= 2,
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  const isPasswordValid = () => Object.values(passwordValidation).every(Boolean);
  const isNewPasswordValid = () => Object.values(newPasswordValidation).every(Boolean);

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: msg }));

  // --- Blur handlers ---
  const handleBlurFirstName = () => setFieldError('firstName', validateNameField(registerForm.firstName, 'El nombre'));
  const handleBlurLastName = () => setFieldError('lastName', validateNameField(registerForm.lastName, 'Los apellidos'));
  const handleBlurBusinessName = () => setFieldError('businessName', validateNameField(registerForm.businessName, 'La razón social'));
  const handleBlurDocumentNumber = () => setFieldError('documentNumber', validateDocumentNumber(registerForm.documentNumber));
  const handleBlurPhone = () => setFieldError('phone', validatePhone(registerForm.phone));
  const handleBlurRegisterEmail = () => setFieldError('email', validateEmail(registerForm.email));
  const handleBlurCity = () => setFieldError('city', validateCity(registerForm.city));
  const handleBlurAddress = () => setFieldError('address', validateAddress(registerForm.address));
  const handleBlurPassword = () => setFieldError('password', validatePassword(registerForm.password));
  const handleBlurConfirmPassword = () =>
    setFieldError('confirmPassword', validateConfirmPassword(registerForm.password, registerForm.confirmPassword));

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
      // El backend ya devuelve userType ('admin' | 'client') basado en el nombre del rol
      const userType = (resp.usuario as any).userType ?? (resp.usuario.rolesId === 1 ? 'admin' : 'client');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Run all validations and collect errors
    const errors: FieldErrors = {};

    if (registerForm.personType === 'natural') {
      errors.firstName = validateNameField(registerForm.firstName, 'El nombre');
      errors.lastName = validateNameField(registerForm.lastName, 'Los apellidos');
    } else {
      errors.businessName = validateNameField(registerForm.businessName, 'La razón social');
    }

    errors.documentNumber = validateDocumentNumber(registerForm.documentNumber);
    errors.phone = validatePhone(registerForm.phone);
    errors.email = validateEmail(registerForm.email);
    errors.city = validateCity(registerForm.city);
    errors.address = validateAddress(registerForm.address);
    errors.password = validatePassword(registerForm.password);
    errors.confirmPassword = validateConfirmPassword(registerForm.password, registerForm.confirmPassword);

    setFieldErrors(errors);

    const hasErrors = Object.values(errors).some(v => v && v.length > 0);
    if (hasErrors) {
      toast.error('Por favor corrige los errores antes de continuar');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        email: registerForm.email,
        password: registerForm.password,
        nombres: registerForm.personType === 'natural' ? registerForm.firstName : registerForm.businessName,
        apellidos: registerForm.personType === 'natural' ? registerForm.lastName : '',
        razon_social: registerForm.personType === 'empresa' ? registerForm.businessName : '',
        tipo_documento: registerForm.documentType,
        numero_documento: registerForm.documentNumber,
        telefono: registerForm.phone,
        ciudad: registerForm.city,
        direccion: registerForm.address || undefined,
      });
      toast.success('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
      setActiveTab('login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setIsRecoveryModalOpen(true);
    setRecoveryStep(1);
    setRecoveryEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCodeExpiry(null);
  };

  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) { toast.error('El correo electrónico es obligatorio'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) { toast.error('Ingresa un correo electrónico válido'); return; }
    setLoading(true);
    try {
      const resp = await authService.forgotPassword(recoveryEmail);
      const code = resp.devCode || '';
      const expiry = new Date(Date.now() + (resp.expiresInMs || 10 * 60 * 1000));
      setCodeExpiry(expiry);
      setRecoveryStep(2);
      toast.success(code ? `Código de verificación enviado. Código: ${code}` : resp.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) { toast.error('El código de verificación es obligatorio'); return; }
    if (verificationCode.length !== 6) { toast.error('El código debe tener 6 dígitos'); return; }
    if (codeExpiry && new Date() > codeExpiry) {
      toast.error('El código de verificación ha expirado. Solicita uno nuevo.');
      setRecoveryStep(1);
      return;
    }
    try {
      await authService.verifyCode(recoveryEmail, verificationCode);
      setRecoveryStep(3);
      toast.success('Código verificado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Código inválido o expirado');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) { toast.error('Todos los campos son obligatorios'); return; }
    if (!isNewPasswordValid()) { toast.error('La nueva contraseña no cumple con los requisitos de seguridad'); return; }
    if (newPassword !== confirmNewPassword) { toast.error('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(recoveryEmail, verificationCode, newPassword);
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
    authService
      .resendCode(recoveryEmail)
      .then((resp) => {
        const code = resp.devCode || '';
        const expiry = new Date(Date.now() + (resp.expiresInMs || 10 * 60 * 1000));
        setCodeExpiry(expiry);
        toast.success(code ? `Nuevo código enviado: ${code}` : resp.message);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al reenviar código'))
      .finally(() => setLoading(false));
  };

  const resetForms = () => {
    setLoginForm({ email: '', password: '' });
    setRegisterForm({
      email: '', firstName: '', lastName: '', businessName: '',
      phone: '', password: '', confirmPassword: '', address: '',
      city: '', personType: 'natural', documentType: 'CC', documentNumber: '',
    });
    setFieldErrors({});
  };

  const getValidationIcon = (isValid: boolean) =>
    isValid ? <CheckIcon className="w-3 h-3 text-green-500" /> : <XIcon className="w-3 h-3 text-red-500" />;

  const closeRecoveryModal = () => {
    setIsRecoveryModalOpen(false);
    setRecoveryStep(1);
    setRecoveryEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCodeExpiry(null);
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-4">
      <div className={`w-full ${activeTab === 'register' ? 'max-w-2xl' : 'max-w-md'} transition-all duration-300`}>
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

              {/* LOGIN TAB */}
              <TabsContent value="login" className="space-y-4 mt-4">
                <div className="text-center">
                  <CardTitle className="text-lg">Bienvenido de vuelta</CardTitle>
                  <CardDescription className="text-sm">Ingresa tus credenciales para continuar</CardDescription>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm">Correo electrónico <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <Input id="login-email" type="email" value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        placeholder="admin@jrepuestos.com" className="pl-10 h-9" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm">Contraseña <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="••••••••" className="pl-10 pr-10 h-9" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-9">
                    {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Iniciando sesión...</>) : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              {/* REGISTER TAB */}
              <TabsContent value="register" className="space-y-3 mt-4">
                <div className="text-center">
                  <CardTitle className="text-lg">Crear nueva cuenta</CardTitle>
                  <CardDescription className="text-sm">Completa la información para registrarte. Los campos marcados con (*) son obligatorios.</CardDescription>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">

                  {/* Tipo de Persona */}
                  <div className="space-y-1">
                    <Label htmlFor="register-personType" className="text-sm">Tipo de persona <span className="text-red-500">*</span></Label>
                    <Select value={registerForm.personType}
                      onValueChange={(value: string) => setRegisterForm({
                        ...registerForm, personType: value,
                        documentType: value === 'natural' ? 'CC' : 'RUT',
                        documentNumber: '', firstName: '', lastName: '', businessName: ''
                      })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="natural"><div className="flex items-center gap-2"><UserIcon className="w-4 h-4" />Persona Natural</div></SelectItem>
                        <SelectItem value="empresa"><div className="flex items-center gap-2"><BuildingIcon className="w-4 h-4" />Empresa</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nombre / Razón Social */}
                  {registerForm.personType === 'natural' ? (
                    <>
                      <div className="space-y-1 pb-4">
                        <Label htmlFor="register-firstName" className="text-sm">Nombres <span className="text-red-500">*</span></Label>
                        <Input id="register-firstName" type="text" value={registerForm.firstName}
                          onChange={(e) => { setRegisterForm({ ...registerForm, firstName: e.target.value }); setFieldError('firstName', ''); }}
                          onBlur={handleBlurFirstName}
                          placeholder="Juan"
                          className={`h-9 text-sm ${fieldErrors.firstName ? 'border-red-400' : ''}`} />
                        {fieldErrors.firstName && <p className="text-xs text-red-500 mt-1 flex items-center gap-2"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.firstName}</p>}
                      </div>
                      <div className="space-y-1 pb-4">
                        <Label htmlFor="register-lastName" className="text-sm">Apellidos <span className="text-red-500">*</span></Label>
                        <Input id="register-lastName" type="text" value={registerForm.lastName}
                          onChange={(e) => { setRegisterForm({ ...registerForm, lastName: e.target.value }); setFieldError('lastName', ''); }}
                          onBlur={handleBlurLastName}
                          placeholder="Pérez Gómez"
                          className={`h-9 text-sm ${fieldErrors.lastName ? 'border-red-400' : ''}`} />
                        {fieldErrors.lastName && <p className="text-xs text-red-500 mt-1 flex items-center gap-2"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.lastName}</p>}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor="register-businessName" className="text-sm">Razón Social <span className="text-red-500">*</span></Label>
                      <Input id="register-businessName" type="text" value={registerForm.businessName}
                        onChange={(e) => { setRegisterForm({ ...registerForm, businessName: e.target.value }); setFieldError('businessName', ''); }}
                        onBlur={handleBlurBusinessName}
                        placeholder="Empresa S.A.S."
                        className={`h-9 text-sm ${fieldErrors.businessName ? 'border-red-400' : ''}`} />
                      {fieldErrors.businessName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.businessName}</p>}
                    </div>
                  )}

                  {/* Tipo de Documento */}
                  <div className="space-y-1">
                    <Label htmlFor="register-documentType" className="text-sm">Tipo de documento <span className="text-red-500">*</span></Label>
                    <Select value={registerForm.documentType}
                      onValueChange={(value: string) => setRegisterForm({ ...registerForm, documentType: value })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {registerForm.personType === 'natural' ? (
                          <>
                            <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                            <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                            <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="RUT">RUT</SelectItem>
                            <SelectItem value="NIT">NIT</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Número de Documento */}
                  <div className="space-y-1">
                    <Label htmlFor="register-documentNumber" className="text-sm">Número de documento <span className="text-red-500">*</span></Label>
                    <Input id="register-documentNumber" type="text" value={registerForm.documentNumber}
                      onChange={(e) => { setRegisterForm({ ...registerForm, documentNumber: e.target.value }); setFieldError('documentNumber', ''); }}
                      onBlur={handleBlurDocumentNumber}
                      placeholder={registerForm.personType === 'empresa' ? '900123456-7' : '1234567890'}
                      className={`h-9 text-sm ${fieldErrors.documentNumber ? 'border-red-400' : ''}`} />
                    {fieldErrors.documentNumber && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.documentNumber}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Email */}
                    <div className="space-y-1">
                      <Label htmlFor="register-email" className="text-sm">Correo electrónico <span className="text-red-500">*</span></Label>
                      <Input id="register-email" type="email" value={registerForm.email}
                        onChange={(e) => { setRegisterForm({ ...registerForm, email: e.target.value }); setFieldError('email', ''); }}
                        onBlur={handleBlurRegisterEmail}
                        placeholder="tu@correo.com"
                        className={`h-9 text-sm ${fieldErrors.email ? 'border-red-400' : ''}`} />
                      {fieldErrors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.email}</p>}
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-1">
                      <Label htmlFor="register-phone" className="text-sm">Teléfono <span className="text-red-500">*</span></Label>
                      <Input id="register-phone" type="tel" value={registerForm.phone}
                        onChange={(e) => { setRegisterForm({ ...registerForm, phone: e.target.value }); setFieldError('phone', ''); }}
                        onBlur={handleBlurPhone}
                        placeholder="+57 300 123 4567"
                        className={`h-9 text-sm ${fieldErrors.phone ? 'border-red-400' : ''}`} />
                      {fieldErrors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.phone}</p>}
                    </div>

                    {/* Ciudad */}
                    <div className="space-y-1">
                      <Label htmlFor="register-city" className="text-sm">Ciudad <span className="text-red-500">*</span></Label>
                      <Input id="register-city" type="text" value={registerForm.city}
                        onChange={(e) => { setRegisterForm({ ...registerForm, city: e.target.value }); setFieldError('city', ''); }}
                        onBlur={handleBlurCity}
                        placeholder="Medellín"
                        className={`h-9 text-sm ${fieldErrors.city ? 'border-red-400' : ''}`} />
                      {fieldErrors.city && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.city}</p>}
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="space-y-1">
                    <Label htmlFor="register-address" className="text-sm">Dirección</Label>
                    <Input id="register-address" type="text" value={registerForm.address}
                      onChange={(e) => { setRegisterForm({ ...registerForm, address: e.target.value }); setFieldError('address', ''); }}
                      onBlur={handleBlurAddress}
                      placeholder="Calle 123 #45-67"
                      className={`h-9 text-sm ${fieldErrors.address ? 'border-red-400' : ''}`} />
                    {fieldErrors.address && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Contraseña */}
                    <div className="space-y-1">
                      <Label htmlFor="register-password" className="text-sm">Contraseña <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input id="register-password" type={showPassword ? 'text' : 'password'} value={registerForm.password}
                          onChange={(e) => { setRegisterForm({ ...registerForm, password: e.target.value }); setFieldError('password', ''); }}
                          onBlur={handleBlurPassword}
                          placeholder="••••••••"
                          className={`pr-10 h-9 text-sm ${fieldErrors.password ? 'border-red-400' : ''}`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.password && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.password}</p>}
                    </div>

                    {/* Confirmar Contraseña */}
                    <div className="space-y-1">
                      <Label htmlFor="register-confirmPassword" className="text-sm">Confirmar contraseña <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input id="register-confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={registerForm.confirmPassword}
                          onChange={(e) => { setRegisterForm({ ...registerForm, confirmPassword: e.target.value }); setFieldError('confirmPassword', ''); }}
                          onBlur={handleBlurConfirmPassword}
                          placeholder="••••••••"
                          className={`pr-10 h-9 text-sm ${fieldErrors.confirmPassword ? 'border-red-400' : ''}`} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                          {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{fieldErrors.confirmPassword}</p>}
                    </div>
                  </div>

                  {/* Password strength indicator */}
                  {registerForm.password && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Requisitos de la contraseña:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          {getValidationIcon(passwordValidation.length)}
                          <span className={passwordValidation.length ? 'text-green-600' : 'text-red-500'}>Mínimo 8 caracteres</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {getValidationIcon(passwordValidation.uppercase)}
                          <span className={passwordValidation.uppercase ? 'text-green-600' : 'text-red-500'}>1 mayúscula</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {getValidationIcon(passwordValidation.numbers)}
                          <span className={passwordValidation.numbers ? 'text-green-600' : 'text-red-500'}>2 números</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {getValidationIcon(passwordValidation.special)}
                          <span className={passwordValidation.special ? 'text-green-600' : 'text-red-500'}>1 especial (!@#$)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit"
                    disabled={loading || !isPasswordValid() || registerForm.password !== registerForm.confirmPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-9 mt-4">
                    {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Creando cuenta...</>) : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>

      {/* Password Recovery Modal */}
      <Dialog open={isRecoveryModalOpen} onOpenChange={closeRecoveryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyIcon className="w-5 h-5 text-blue-600" />Recuperar Contraseña
            </DialogTitle>
            <DialogDescription>
              {recoveryStep === 1 && "Te enviaremos un código de verificación a tu correo electrónico"}
              {recoveryStep === 2 && "Ingresa el código de verificación que enviamos a tu correo"}
              {recoveryStep === 3 && "Crea una nueva contraseña segura"}
              {recoveryStep === 4 && "Tu contraseña ha sido restablecida exitosamente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1 */}
            {recoveryStep === 1 && (
              <form onSubmit={handleSendRecoveryEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email" className="text-sm">Correo electrónico <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input id="recovery-email" type="email" value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="tu@correo.com" className="pl-10 h-9" required />
                  </div>
                  <p className="text-xs text-gray-500">Debe ser el correo asociado a tu cuenta</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeRecoveryModal} className="flex-1">Cancelar</Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Enviando...</>) : 'Enviar Código'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2 */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Código enviado a: <span className="font-medium">{recoveryEmail}</span></p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verification-code" className="text-sm">Código de verificación <span className="text-red-500">*</span></Label>
                  <Input id="verification-code" type="text" value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456" className="h-9 text-center text-lg tracking-widest" maxLength={6} required />
                  <p className="text-xs text-gray-500">Ingresa el código de 6 dígitos que recibiste</p>
                </div>
                <div className="text-center">
                  <button type="button" onClick={handleResendCode}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    ¿No recibiste el código? Reenviar
                  </button>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setRecoveryStep(1)} className="flex-1">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />Atrás
                  </Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Verificar</Button>
                </div>
              </form>
            )}

            {/* Step 3 */}
            {recoveryStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm">Nueva contraseña <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input id="new-password" type={showNewPassword ? 'text' : 'password'} value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••" className="pr-10 h-9" required />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                        {showNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password" className="text-sm">Confirmar nueva contraseña <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input id="confirm-new-password" type={showConfirmNewPassword ? 'text' : 'password'} value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`pr-10 h-9 ${confirmNewPassword && newPassword !== confirmNewPassword ? 'border-red-500' : ''}`} required />
                      <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                        {showConfirmNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircleIcon className="w-3 h-3" />Las contraseñas no coinciden
                      </p>
                    )}
                  </div>
                </div>
                {newPassword && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Requisitos de la contraseña:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        {getValidationIcon(newPasswordValidation.length)}
                        <span className={newPasswordValidation.length ? 'text-green-600' : 'text-red-500'}>Mínimo 8 caracteres</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {getValidationIcon(newPasswordValidation.uppercase)}
                        <span className={newPasswordValidation.uppercase ? 'text-green-600' : 'text-red-500'}>1 mayúscula</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {getValidationIcon(newPasswordValidation.numbers)}
                        <span className={newPasswordValidation.numbers ? 'text-green-600' : 'text-red-500'}>2 números</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {getValidationIcon(newPasswordValidation.special)}
                        <span className={newPasswordValidation.special ? 'text-green-600' : 'text-red-500'}>1 especial (!@#$)</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setRecoveryStep(2)} className="flex-1">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />Atrás
                  </Button>
                  <Button type="submit" disabled={loading || !isNewPasswordValid() || newPassword !== confirmNewPassword}
                    className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Guardando...</>) : 'Cambiar Contraseña'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4 */}
            {recoveryStep === 4 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¡Contraseña restablecida!</h3>
                  <p className="text-sm text-gray-600">Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
                </div>
                <Button onClick={closeRecoveryModal} className="w-full bg-blue-600 hover:bg-blue-700">Ir a Iniciar Sesión</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
