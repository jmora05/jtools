/**
 * E2E manual (Playwright) — selector de Departamento/Ciudad.
 *
 * Qué cubre:
 *   1. El popover de Departamento/Ciudad se despliega hacia abajo y tiene
 *      scroll (240px de alto) en vez de desbordarse fuera de la pantalla.
 *   2. La selección de un departamento/ciudad realmente queda guardada en
 *      el formulario (regresión del bug de "stale state" en Empleados y
 *      Registro: dos setState encadenados con el mismo snapshot viejo
 *      hacían que el segundo pisara al primero).
 *
 * Se prueban los 5 formularios que usan <DepartamentoCiudadSelect />:
 *   - Registro público (LoginPage, sin sesión)
 *   - Clientes            (admin)
 *   - Empleados           (admin)
 *   - Proveedores         (admin)
 *   - Perfil de Cliente   (sesión de cliente)
 *
 * Requisitos antes de correrlo:
 *   - Backend corriendo en :5000        → cd backend && node src/index.js
 *   - Frontend corriendo en :5173/5174  → cd frontend && VITE_API_URL=http://localhost:5000/api npx vite
 *   - Un admin con credenciales ADMIN_EMAIL/ADMIN_PASSWORD (ver abajo).
 *   - Un cliente persona-natural (no empresa) con CLIENTE_EMAIL/CLIENTE_PASSWORD.
 *     (Los clientes tipo Empresa con razon_social nula crashean el Perfil
 *     por un bug aparte, no relacionado con este selector — ver hallazgo 
 *     reportado por separado.)
 *
 * Uso:
 *   node e2e/departamento-ciudad.e2e.js [http://localhost:PUERTO]
 */
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:5174';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@jrepuestos.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const CLIENTE_EMAIL = process.env.CLIENTE_EMAIL || 'juani@dog.com';
const CLIENTE_PASSWORD = process.env.CLIENTE_PASSWORD || 'Test1234!';

// El popover debe abrirse con la lista dentro del viewport (y >= 0) y con
// una altura acotada (240px) en vez del alto sin límite (~931px) que
// causaba el bug original de posicionamiento.
async function checkDropdownOpensDownwardWithScroll(page, label) {
  await page.waitForTimeout(400);
  const list = page.locator('[data-slot="command-list"]').first();
  await list.waitFor({ timeout: 5000 });
  const box = await list.boundingBox();
  const ok = box.y >= 0 && box.height <= 260;
  console.log(`  [${label}] list box=${JSON.stringify(box)} -> ${ok ? 'OK' : 'FALLA'}`);
  if (!ok) throw new Error(`${label}: el listado no se desplegó correctamente (box=${JSON.stringify(box)})`);
}

// Tras hacer click en un item del listado, el botón trigger debe reflejar
// el valor elegido. Si no, es el bug de stale-state (el setState
// encadenado de Departamento->Ciudad pisó el cambio).
async function assertValueStuck(page, label, expectedText) {
  const visible = await page.getByRole('button', { name: new RegExp(expectedText, 'i') }).first().isVisible().catch(() => false);
  console.log(`  [${label}] valor "${expectedText}" guardado -> ${visible ? 'OK' : 'FALLA'}`);
  if (!visible) throw new Error(`${label}: la selección de "${expectedText}" no quedó guardada`);
}

async function pickDepartamentoYCiudad(page, label) {
  const deptoBtn = page.getByRole('button', { name: /selecciona un departamento|por definir/i }).first();
  await deptoBtn.click();
  await checkDropdownOpensDownwardWithScroll(page, `${label}-departamento`);
  await page.locator('[data-slot="command-item"]', { hasText: 'Antioquia' }).first().click();
  await page.waitForTimeout(300);
  await assertValueStuck(page, `${label}-departamento`, 'antioquia');

  const ciudadBtn = page.getByRole('button', { name: /selecciona una ciudad|cartagena/i }).first();
  await ciudadBtn.click();
  await checkDropdownOpensDownwardWithScroll(page, `${label}-ciudad`);
  await page.locator('[data-slot="command-item"]', { hasText: 'Medellín' }).first().click();
  await page.waitForTimeout(300);
  await assertValueStuck(page, `${label}-ciudad`, 'medell');
}

async function login(page, email, password) {
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).last().click();
  await page.waitForTimeout(1500);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));

  // ── 1. Registro público (sin sesión) ─────────────────────────────────────
  console.log('\n1) Registro público');
  await page.goto(BASE);
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).first().click();
  await page.waitForTimeout(400);
  await page.locator('[role=tab]', { hasText: 'Registrarse' }).click();
  await page.waitForTimeout(400);
  await pickDepartamentoYCiudad(page, 'REGISTRO');

  // ── 2. Login admin ────────────────────────────────────────────────────────
  await page.locator('[role=tab]', { hasText: 'Iniciar Sesión' }).click();
  await page.waitForTimeout(300);
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  // ── 3. Clientes ───────────────────────────────────────────────────────────
  console.log('\n2) Clientes');
  await page.getByText('Clientes', { exact: true }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /nuevo cliente/i }).first().click();
  await page.waitForTimeout(600);
  await pickDepartamentoYCiudad(page, 'CLIENTES');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ── 4. Empleados ──────────────────────────────────────────────────────────
  console.log('\n3) Empleados');
  await page.getByText('Empleados', { exact: true }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /registrar empleado/i }).first().click();
  await page.waitForTimeout(600);
  await pickDepartamentoYCiudad(page, 'EMPLEADOS');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ── 5. Proveedores ────────────────────────────────────────────────────────
  console.log('\n4) Proveedores');
  await page.getByText('Proveedores', { exact: true }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /nuevo proveedor/i }).first().click();
  await page.waitForTimeout(600);
  await pickDepartamentoYCiudad(page, 'PROVEEDORES');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ── 6. Logout admin + login cliente + Perfil de Cliente ─────────────────
  console.log('\n5) Perfil de Cliente');
  await page.evaluate(() => {
    localStorage.removeItem('jrepuestos_token');
    localStorage.removeItem('jrepuestos_user');
  });
  await page.goto(BASE);
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).first().click();
  await page.waitForTimeout(400);
  await login(page, CLIENTE_EMAIL, CLIENTE_PASSWORD);
  await page.getByText('Ajustes', { exact: true }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /editar informaci[oó]n/i }).first().click();
  await page.waitForTimeout(600);
  await pickDepartamentoYCiudad(page, 'PERFIL-CLIENTE');

  console.log('\nTODOS LOS FORMULARIOS OK');
  await browser.close();
})().catch((e) => {
  console.error('\nFALLÓ:', e.message);
  process.exit(1);
});
