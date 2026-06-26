import { useState } from 'react';
import { ChevronDownIcon, MapPinIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/shared/components/ui/command';
import { cn } from '@/shared/components/ui/utils';
import {
  getAllDepartamentos, getCiudadesByDepartamento,
} from '@/shared/data/colombiaDepartamentosCiudades';

// ── Combobox de un solo selector, con búsqueda ─────────────────────────────────
function SearchableSelect({
  value, options, onChange, placeholder, disabled, error, emptyMessage,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  error?: string;
  emptyMessage: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            'border-input data-[placeholder]:text-muted-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
          )}
        >
          <span className={cn('flex items-center gap-2 truncate', !value && 'text-muted-foreground')}>
            <MapPinIcon className="size-4 shrink-0 opacity-50" />
            {value || placeholder}
          </span>
          <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: 280 }}
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={`Buscar...`} />
          <CommandList style={{ maxHeight: 240, overflowY: 'auto' }}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => { onChange(opt); setOpen(false); }}
                >
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Selector encadenado Departamento → Ciudad ──────────────────────────────────
export interface DepartamentoCiudadSelectProps {
  departamento: string;
  ciudad: string;
  onDepartamentoChange: (departamento: string) => void;
  onCiudadChange: (ciudad: string) => void;
  departamentoError?: string;
  ciudadError?: string;
  disabled?: boolean;
  departamentoRequired?: boolean;
  ciudadRequired?: boolean;
}

export function DepartamentoCiudadSelect({
  departamento, ciudad, onDepartamentoChange, onCiudadChange,
  departamentoError, ciudadError, disabled,
  departamentoRequired = true, ciudadRequired = true,
}: DepartamentoCiudadSelectProps) {
  const ciudades = getCiudadesByDepartamento(departamento);

  const handleDepartamentoChange = (nuevoDepartamento: string) => {
    onDepartamentoChange(nuevoDepartamento);
    onCiudadChange('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-700 mb-2">
          Departamento {departamentoRequired && <span className="text-red-500">*</span>}
        </label>
        <SearchableSelect
          value={departamento}
          options={getAllDepartamentos()}
          onChange={handleDepartamentoChange}
          placeholder="Selecciona un departamento"
          disabled={disabled}
          error={departamentoError}
          emptyMessage="No se encontró el departamento"
        />
        {departamentoError && (
          <p className="text-xs text-red-500 mt-1">{departamentoError}</p>
        )}
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-2">
          Ciudad {ciudadRequired && <span className="text-red-500">*</span>}
        </label>
        <SearchableSelect
          value={ciudad}
          options={ciudades}
          onChange={onCiudadChange}
          placeholder={departamento ? 'Selecciona una ciudad' : 'Selecciona primero un departamento'}
          disabled={disabled || !departamento}
          error={ciudadError}
          emptyMessage="No se encontró la ciudad"
        />
        {ciudadError && (
          <p className="text-xs text-red-500 mt-1">{ciudadError}</p>
        )}
      </div>
    </div>
  );
}
