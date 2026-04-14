const renderClienteSection = () => {
  // En modo edición, mostrar los datos existentes (solo lectura, igual que antes)
  if (isEditMode) {
    return (
      <Card className="shadow-lg border-2 border-gray-100">
        <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-xl text-gray-900">👤 Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-8 px-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Nombre Completo">
              <Input value={orderForm.clientName} readOnly
                className="h-12 text-base bg-gray-50 text-gray-500 cursor-not-allowed" />
            </Field>
            <Field label="Teléfono">
              <Input value={orderForm.clientPhone} readOnly
                className="h-12 text-base bg-gray-50 text-gray-500 cursor-not-allowed" />
            </Field>
          </div>
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Los datos del cliente no se pueden modificar desde aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Modo creación: autocomplete ───────────────────────────────────────────
  return (
    <Card className="shadow-lg border-2 border-gray-100">
      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-xl text-gray-900">👤 Seleccionar Cliente</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 px-10 pb-10 space-y-5">

        {/* ── Buscador ── */}
        <Field
          label="Buscar Cliente"
          required
          error={formErrors.clientId}
          hint={!formErrors.clientId ? 'Escribe el nombre o empresa del cliente (mín. 2 caracteres)' : undefined}
        >
          <div ref={searchRef} className="relative">
            {/* Input */}
            <div className={`relative flex items-center border rounded-lg h-12 transition-all
              ${formErrors.clientId ? 'border-red-400' : 'border-input'}
              ${clienteSeleccionado ? 'bg-blue-50 border-blue-300' : 'bg-white'}
            `}>
              {clienteSearch.loading
                ? <LoaderCircleIcon className="absolute left-4 w-4 h-4 text-blue-500 animate-spin" />
                : <SearchIcon className="absolute left-4 w-4 h-4 text-gray-400" />
              }
              <input
                type="text"
                placeholder="Ej: Carlos Ramírez o Empresa ABC..."
                value={clienteSeleccionado ? clienteSearch.query : clienteSearch.query}
                onChange={e => {
                  // Si ya había un cliente seleccionado, limpiar selección
                  if (clienteSeleccionado) {
                    setClienteSeleccionado(null);
                    setOrderForm(prev => ({
                      ...prev,
                      clientId: '', clientName: '', clientPhone: '',
                      email: '', documentType: '', documentNumber: '',
                    }));
                    setFormErrors(prev => ({ ...prev, clientId: 'Debes seleccionar un cliente válido de la lista' }));
                  }
                  clienteSearch.search(e.target.value);
                }}
                onFocus={() => clienteSearch.query.length >= 2 && clienteSearch.setOpen(true)}
                className={`w-full h-full pl-10 pr-10 bg-transparent text-sm outline-none rounded-lg
                  ${clienteSeleccionado ? 'text-blue-800 font-medium' : 'text-gray-900'}`}
              />
              {/* Ícono de estado */}
              {clienteSeleccionado && (
                <CheckIcon className="absolute right-10 w-4 h-4 text-green-500" />
              )}
              {/* Botón limpiar */}
              {clienteSearch.query && (
                <button type="button"
                  onClick={() => {
                    clienteSearch.clear();
                    setClienteSeleccionado(null);
                    setOrderForm(prev => ({
                      ...prev,
                      clientId: '', clientName: '', clientPhone: '',
                      email: '', documentType: '', documentNumber: '',
                    }));
                    setFormErrors(prev => ({ ...prev, clientId: 'Debes seleccionar un cliente de la lista' }));
                  }}
                  className="absolute right-3 text-gray-400 hover:text-gray-600">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── Dropdown ── */}
            {clienteSearch.open && clienteSearch.query.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                {clienteSearch.loading ? (
                  <div className="flex items-center gap-3 px-4 py-4 text-sm text-gray-500">
                    <LoaderCircleIcon className="w-4 h-4 animate-spin text-blue-500" />
                    Buscando clientes...
                  </div>
                ) : clienteSearch.results.length === 0 ? (
                  <div className="px-4 py-5 text-center">
                    <p className="text-sm text-gray-500">No se encontraron clientes para</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">"{clienteSearch.query}"</p>
                    <p className="text-xs text-gray-400 mt-2">Verifica el nombre o registra el cliente primero</p>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs text-gray-500">{clienteSearch.results.length} resultado(s)</p>
                    </div>
                    {clienteSearch.results.map(cliente => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => {
                          // ── Mapear campos del cliente al form ──
                          setClienteSeleccionado(cliente);
                          clienteSearch.setOpen(false);

                          const nombre = `${cliente.nombres} ${cliente.apellidos}`.trim();
                          clienteSearch.search(nombre); // mostrar nombre en el input

                          setOrderForm(prev => ({
                            ...prev,
                            clientId:       String(cliente.id),
                            clientName:     nombre,
                            clientPhone:    cliente.telefono   ?? '',
                            email:          cliente.email      ?? '',
                            documentType:   cliente.tipoDocumento ?? '',
                            documentNumber: cliente.numeroDocumento ?? '',
                          }));

                          // Limpiar error de cliente
                          setFormErrors(prev => { const n = { ...prev }; delete n.clientId; return n; });
                          setTouched(prev => ({ ...prev, clientId: true }));
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                            <span className="text-xs font-bold text-blue-700">
                              {(cliente.nombres?.[0] ?? '?').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {cliente.nombres} {cliente.apellidos}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {cliente.empresa && <span className="mr-2">🏢 {cliente.empresa}</span>}
                              {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                            </p>
                          </div>
                          {cliente.tipoDocumento && (
                            <span className="text-xs text-gray-400 shrink-0">
                              {cliente.tipoDocumento} {cliente.numeroDocumento}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </Field>

        {/* ── Tarjeta del cliente seleccionado ── */}
        {clienteSeleccionado && (
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold">
              <CheckIcon className="w-4 h-4 text-green-500" />
              Cliente seleccionado
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Nombre completo</p>
                <p className="font-medium text-gray-800">
                  {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
                </p>
              </div>
              {clienteSeleccionado.empresa && (
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="font-medium text-gray-800">{clienteSeleccionado.empresa}</p>
                </div>
              )}
              {clienteSeleccionado.telefono && (
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-800">{clienteSeleccionado.telefono}</p>
                </div>
              )}
              {clienteSeleccionado.email && (
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800 truncate">{clienteSeleccionado.email}</p>
                </div>
              )}
              {clienteSeleccionado.tipoDocumento && (
                <div>
                  <p className="text-xs text-gray-500">Documento</p>
                  <p className="font-medium text-gray-800">
                    {clienteSeleccionado.tipoDocumento} {clienteSeleccionado.numeroDocumento}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};