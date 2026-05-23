// src/features/products/components/ImageUploader.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Link2, X, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';

// ─── Constantes ───────────────────────────────────────────────────────────────
const VALID_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'] as const;
const MAX_MB           = 5;
const MAX_BYTES        = MAX_MB * 1024 * 1024;

// ─── Utilidad exportable ──────────────────────────────────────────────────────
// Úsala también en el formulario para validar en tiempo real.
export function isValidImageUrl(value: string): boolean {
    if (!value) return true;
    // Data URL base64 (generada por subida desde PC) — siempre válida
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(value)) return true;
    try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
        // La ruta debe terminar en una extensión de imagen (ignorar query params)
        const pathname = url.pathname.toLowerCase().split('?')[0];
        return VALID_EXTENSIONS.some(ext => pathname.endsWith(ext));
    } catch {
        return false;
    }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ImageUploaderProps {
    value:    string;               // URL actual o string base64
    onChange: (val: string) => void;
    disabled?: boolean;
    label?:   string;
}

type Tab = 'url' | 'file';

// ─── Componente ───────────────────────────────────────────────────────────────
export function ImageUploader({ value, onChange, disabled = false, label = 'Imagen del producto' }: ImageUploaderProps) {
    const [tab,        setTab]        = useState<Tab>(value?.startsWith('data:') ? 'file' : 'url');
    const [urlInput,   setUrlInput]   = useState<string>(value && !value.startsWith('data:') ? value : '');
    const [urlErr,     setUrlErr]     = useState('');
    const [fileErr,    setFileErr]    = useState('');
    const [converting, setConverting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Subida desde PC → base64 ──────────────────────────────────────────────
    const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileErr('');

        if (!file) return;

        // Validar tipo MIME
        if (!(VALID_MIME_TYPES as readonly string[]).includes(file.type)) {
            setFileErr('Formato inválido. Solo PNG, JPG, JPEG, WEBP y GIF.');
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        // Validar tamaño
        if (file.size > MAX_BYTES) {
            setFileErr(`El archivo supera el límite de ${MAX_MB}MB.`);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        setConverting(true);
        const reader = new FileReader();

        reader.onload = () => {
            onChange(reader.result as string);
            setConverting(false);
        };

        reader.onerror = () => {
            setFileErr('Error al leer el archivo. Intenta de nuevo.');
            setConverting(false);
            if (inputRef.current) inputRef.current.value = '';
        };

        reader.readAsDataURL(file);
    }, [onChange]);

    // ── Commit de URL manual ──────────────────────────────────────────────────
    const commitUrl = () => {
        const v = urlInput.trim();
        if (!v) { setUrlErr(''); onChange(''); return; }
        if (!isValidImageUrl(v)) {
            setUrlErr('Solo se permiten links directos de imágenes válidas (.png, .jpg, .jpeg, .webp...)');
            return;
        }
        setUrlErr('');
        onChange(v);
    };

    // ── Limpiar imagen ────────────────────────────────────────────────────────
    const handleClear = () => {
        onChange('');
        setUrlInput('');
        setUrlErr('');
        setFileErr('');
        if (inputRef.current) inputRef.current.value = '';
    };

    const switchTab = (t: Tab) => { setTab(t); setUrlErr(''); setFileErr(''); };

    return (
        <div className="space-y-3">
            {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

            {/* ── Tabs ── */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                {(['url', 'file'] as Tab[]).map(t => (
                    <button
                        key={t}
                        type="button"
                        disabled={disabled}
                        onClick={() => switchTab(t)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors
                            ${tab === t
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed'}`}
                    >
                        {t === 'url'
                            ? <><Link2 className="w-3.5 h-3.5" />URL de imagen</>
                            : <><Upload className="w-3.5 h-3.5" />Subir desde PC</>}
                    </button>
                ))}
            </div>

            {/* ── Panel URL ── */}
            {tab === 'url' && (
                <div className="space-y-1">
                    <Input
                        type="url"
                        placeholder="https://example.com/imagen.png"
                        value={urlInput}
                        onChange={e => { setUrlInput(e.target.value); if (urlErr) setUrlErr(''); }}
                        onBlur={commitUrl}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitUrl(); } }}
                        disabled={disabled}
                        className={urlErr ? 'border-red-400 focus-visible:ring-red-300' : ''}
                    />
                    {urlErr
                        ? <p className="flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3 shrink-0" />{urlErr}
                          </p>
                        : <p className="text-xs text-gray-400">
                            Solo links directos que terminen en .png, .jpg, .jpeg, .webp o .gif
                          </p>
                    }
                </div>
            )}

            {/* ── Panel File ── */}
            {tab === 'file' && (
                <div className="space-y-1">
                    <div
                        role="button"
                        tabIndex={disabled || converting ? -1 : 0}
                        aria-disabled={disabled || converting}
                        onClick={() => !disabled && !converting && inputRef.current?.click()}
                        onKeyDown={e => { if (e.key === 'Enter' && !disabled && !converting) inputRef.current?.click(); }}
                        className={`border-2 border-dashed rounded-lg p-5 text-center select-none transition-colors
                            ${disabled || converting
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'}`}
                    >
                        {/* Input oculto real */}
                        <input
                            ref={inputRef}
                            type="file"
                            accept={VALID_MIME_TYPES.join(',')}
                            onChange={handleFile}
                            disabled={disabled || converting}
                            className="sr-only"
                            aria-hidden="true"
                        />
                        {converting
                            ? <Loader2 className="w-7 h-7 mx-auto text-blue-400 animate-spin mb-1.5" />
                            : <Upload className="w-7 h-7 mx-auto text-blue-400 mb-1.5" />
                        }
                        <p className="text-sm font-medium text-blue-700">
                            {converting ? 'Procesando imagen...' : 'Haz clic para seleccionar un archivo'}
                        </p>
                        <p className="text-xs text-blue-500 mt-0.5">
                            PNG, JPG, JPEG, WEBP, GIF · Máx. {MAX_MB}MB
                        </p>
                    </div>
                    {fileErr && (
                        <p className="flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3 shrink-0" />{fileErr}
                        </p>
                    )}
                </div>
            )}

            {/* ── Preview ── */}
            {value && (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                        src={value}
                        alt="Vista previa"
                        className="w-full max-h-44 object-contain"
                        onError={() => {
                            if (!value.startsWith('data:')) {
                                setUrlErr('No se pudo cargar la imagen desde esa URL.');
                            }
                        }}
                    />
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            title="Eliminar imagen"
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}