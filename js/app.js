/* =============================================
   CRYPTOLAB — Lógica de Interfaz de Usuario
   Archivo: js/app.js
   Descripción: Maneja todos los eventos del DOM,
   actualiza la interfaz y conecta la UI con las
   funciones matemáticas definidas en crypto.js.
   Debe cargarse DESPUÉS de crypto.js en el HTML.
   ============================================= */


/* --------------------------------------------------
   INICIALIZACIÓN DEL CHARSET
   Configura los botones de preset para cargar
   conjuntos de caracteres predefinidos en el input.
   Se llama al cargar cualquier página que tenga
   el elemento #charset.
-------------------------------------------------- */
function initCharsetPresets() {
  const charsetInput = document.getElementById('charset');
  if (!charsetInput) return; // Si no existe en la página, salir

  // Preset: alfabeto estándar sin Ñ (26 caracteres)
  const btnSinNye = document.getElementById('preset-sin-nye');
  if (btnSinNye) {
    btnSinNye.addEventListener('click', () => {
      charsetInput.value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      onCharsetChange(); // Actualizar visualización
    });
  }

  // Preset: alfabeto español con Ñ (27 caracteres)
  const btnConNye = document.getElementById('preset-con-nye');
  if (btnConNye) {
    btnConNye.addEventListener('click', () => {
      charsetInput.value = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
      onCharsetChange();
    });
  }

  // Preset: alfanumérico (36 caracteres)
  const btnAlfa = document.getElementById('preset-alfanumerico');
  if (btnAlfa) {
    btnAlfa.addEventListener('click', () => {
      charsetInput.value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      onCharsetChange();
    });
  }

  // Actualizar visualización cuando el usuario edita el charset manualmente
  charsetInput.addEventListener('input', onCharsetChange);
}


/* --------------------------------------------------
   EVENTO: CAMBIO EN EL CHARSET
   Se dispara cuando el usuario modifica el conjunto
   de caracteres. Actualiza la visualización del
   mapa de caracteres en tiempo real.
-------------------------------------------------- */
function onCharsetChange() {
  // Solo actualizar si estamos en la página de cifrado
  if (document.getElementById('cipher-method')) {
    updateCipherUI();
  }
}


/* --------------------------------------------------
   INICIALIZACIÓN DE LA PÁGINA DE CIFRADO (cifrar.html)
   Configura el selector de método, el control de
   módulo y el botón de cifrar.
-------------------------------------------------- */
function initCipherPage() {
  // Verificar que estamos en la página correcta
  const methodSelect = document.getElementById('cipher-method');
  if (!methodSelect) return;

  // Evento: cambio de método (César / Atbash)
  methodSelect.addEventListener('change', updateCipherUI);

  // Evento: cambio del módulo de desplazamiento
  const shiftInput = document.getElementById('shift-val');
  if (shiftInput) {
    shiftInput.addEventListener('input', updateCipherUI);
  }

  // Evento: escribir en el textarea de texto plano
  const plaintextArea = document.getElementById('plaintext');
  if (plaintextArea) {
    plaintextArea.addEventListener('input', updateCipherUI);
  }

  // Evento: botón de cifrar
  const encryptBtn = document.getElementById('btn-encrypt');
  if (encryptBtn) {
    encryptBtn.addEventListener('click', doEncrypt);
  }

  // Evento: botón de copiar resultado
  const copyBtn = document.getElementById('btn-copy-cipher');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyToClipboard('ciphertext-out'));
  }

  // Renderizar mapa inicial
  updateCipherUI();
}


/* --------------------------------------------------
   ACTUALIZAR INTERFAZ DE CIFRADO
   Se ejecuta cada vez que cambia el método, el módulo
   o el texto. Muestra/oculta el control de módulo
   según el método y redibuja el mapa de caracteres.
-------------------------------------------------- */
function updateCipherUI() {
  const method = document.getElementById('cipher-method')?.value || 'cesar';
  const cs     = getCharset();
  const shift  = parseInt(document.getElementById('shift-val')?.value) || 3;

  // Mostrar el control de módulo solo para César
  const shiftField = document.getElementById('shift-field');
  if (shiftField) {
    shiftField.style.display = method === 'cesar' ? '' : 'none';
  }

  // Redibujar la visualización del mapa de caracteres
  if (document.getElementById('char-map-wrap')) {
    renderCharMap(method, cs, shift, 'char-map-wrap');
  }
}


/* --------------------------------------------------
   CAMBIAR MÓDULO CON BOTONES +/−
   Ajusta el valor del input de módulo y lo mantiene
   dentro del rango válido [1, n-1] donde n es el
   tamaño del charset. Envuelve circularmente.

   @param {number} delta - Cantidad a sumar (+1 o -1)
-------------------------------------------------- */
function changeShift(delta) {
  const shiftInput = document.getElementById('shift-val');
  const cs         = getCharset();

  let value = parseInt(shiftInput.value) + delta;

  // Envolver: si pasa del máximo vuelve al mínimo y viceversa
  value = ((value - 1 + cs.length) % cs.length) + 1;

  shiftInput.value = value;
  updateCipherUI(); // Refrescar la visualización
}


/* --------------------------------------------------
   EJECUTAR CIFRADO
   Lee el texto y la configuración, aplica el cifrado
   seleccionado y muestra el resultado en pantalla.
   Valida los datos antes de procesar.
-------------------------------------------------- */
function doEncrypt() {
  const cs     = getCharset();
  const text   = document.getElementById('plaintext')?.value || '';
  const method = document.getElementById('cipher-method')?.value || 'cesar';
  const shift  = parseInt(document.getElementById('shift-val')?.value) || 3;

  // --- Validaciones ---
  if (!text.trim()) {
    showError('Por favor escribe un mensaje para cifrar.');
    return;
  }
  if (cs.length < 2) {
    showError('El conjunto de caracteres debe tener al menos 2 caracteres.');
    return;
  }

  let encryptedText, badgeHTML, infoText;

  if (method === 'cesar') {
    // --- Aplicar cifrado César ---
    encryptedText = cesarEncrypt(text, cs, shift);
    badgeHTML = `<div class="badge badge-cesar">⊛ César · Módulo ${shift}</div>`;
    infoText  = `Cifrado César con desplazamiento de ${shift} posición(es) `
              + `sobre un charset de ${cs.length} caracteres. `
              + `Para descifrar se necesita conocer el módulo (${shift}).`;
  } else {
    // --- Aplicar cifrado Atbash ---
    encryptedText = atbashProcess(text, cs);
    badgeHTML = `<div class="badge badge-atbash">⊘ Atbash · Espejo</div>`;
    infoText  = `Cifrado Atbash: cada carácter es reemplazado por su simétrico `
              + `en el charset. No requiere clave adicional.`;
  }

  // --- Mostrar resultado ---
  const resultPanel = document.getElementById('encrypt-result-panel');
  const badgeEl     = document.getElementById('encrypt-badge');
  const outputEl    = document.getElementById('ciphertext-out');
  const infoEl      = document.getElementById('encrypt-info-text');

  if (resultPanel) resultPanel.style.display = 'block';
  if (badgeEl)     badgeEl.innerHTML  = badgeHTML;
  if (outputEl)    outputEl.value     = encryptedText;
  if (infoEl)      infoEl.textContent = infoText;
}


/* --------------------------------------------------
   INICIALIZACIÓN DE LA PÁGINA DE DESCIFRADO (descifrar.html)
   Configura el botón de descifrar y el botón de copiar.
-------------------------------------------------- */
function initDecryptPage() {
  // Verificar que estamos en la página correcta
  const decryptBtn = document.getElementById('btn-decrypt');
  if (!decryptBtn) return;

  // Evento: botón de descifrar
  decryptBtn.addEventListener('click', doDecrypt);

  // Evento: botón de copiar resultado
  const copyBtn = document.getElementById('btn-copy-decrypt');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyToClipboard('dec-out'));
  }
}


/* --------------------------------------------------
   EJECUTAR DESCIFRADO AUTOMÁTICO
   Lee el texto cifrado, llama a autoDetectAndDecrypt()
   de crypto.js y construye la interfaz de resultados
   con el método detectado, el texto descifrado y la
   tabla de todos los módulos explorados.
-------------------------------------------------- */
function doDecrypt() {
  const cs         = getCharset();
  const ciphertext = document.getElementById('ciphertext-in')?.value || '';

  // --- Validaciones ---
  if (!ciphertext.trim()) {
    showError('Por favor pega el texto cifrado a analizar.');
    return;
  }
  if (cs.length < 2) {
    showError('El conjunto de caracteres debe tener al menos 2 caracteres.');
    return;
  }

  // --- Llamar a la función de detección automática (crypto.js) ---
  const detection = autoDetectAndDecrypt(ciphertext, cs);

  // --- Construir HTML de resultados ---
  const decodeBody = document.getElementById('decode-body');
  if (!decodeBody) return;

  let html = '';

  if (detection.method === 'atbash') {
    /* ---- Resultado: Atbash detectado ---- */
    html += `
      <div class="badge badge-atbash">⊘ Atbash Detectado · Alta Confianza</div>
      <p class="detection-info" style="margin-bottom:1rem">
        El análisis de frecuencia (Índice de Coincidencia = ${detection.score.toFixed(4)})
        sugiere cifrado Atbash. El texto presenta simetría respecto al charset configurado.
      </p>
      <div class="field-group">
        <label>Texto descifrado (Atbash)</label>
        <div class="result-area">
          <textarea id="dec-out" rows="4" readonly>${detection.result}</textarea>
          <button class="copy-btn" id="btn-copy-decrypt"
            onclick="copyToClipboard('dec-out')">COPIAR</button>
        </div>
      </div>`;
  } else {
    /* ---- Resultado: César detectado ---- */
    html += `
      <div class="badge badge-cesar">⊛ César Detectado · Módulo ${detection.shift}</div>
      <p class="detection-info" style="margin-bottom:1rem">
        El análisis por fuerza bruta e Índice de Coincidencia
        (IC = ${detection.score.toFixed(4)}) sugiere desplazamiento de
        <strong style="color:var(--gold)">${detection.shift}</strong>.
        Se probaron todos los módulos posibles (1–${cs.length - 1}).
      </p>
      <div class="field-group">
        <label>Texto descifrado (César · módulo ${detection.shift})</label>
        <div class="result-area">
          <textarea id="dec-out" rows="4" readonly>${detection.result}</textarea>
          <button class="copy-btn"
            onclick="copyToClipboard('dec-out')">COPIAR</button>
        </div>
      </div>`;
  }

  /* ---- Tabla de todos los módulos César explorados ---- */
  html += `
    <hr class="divider">
    <p style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;
              color:var(--text-muted);letter-spacing:.1em;text-transform:uppercase;
              margin-bottom:.6rem">
      Todos los módulos César explorados
    </p>
    <div class="modules-scroll">`;

  detection.allShifts.forEach(({ shift, text, score }) => {
    const isBest = (shift === detection.shift) && (detection.method === 'cesar');
    html += `
      <div class="module-row ${isBest ? 'best' : ''}">
        <span class="module-label">mod ${String(shift).padStart(2, '0')}</span>
        <span class="module-text">${text.slice(0, 65)}${text.length > 65 ? '…' : ''}</span>
      </div>`;
  });

  html += '</div>';

  // --- Mostrar panel de resultados ---
  decodeBody.innerHTML = html;
  const decodeResults = document.getElementById('decode-results');
  if (decodeResults) decodeResults.style.display = 'block';
}


/* --------------------------------------------------
   MOSTRAR MENSAJE DE ERROR
   Muestra un alert simple. Puede reemplazarse por
   una notificación personalizada en el futuro.

   @param {string} message - Mensaje de error a mostrar
-------------------------------------------------- */
function showError(message) {
  alert(message);
}


/* --------------------------------------------------
   INICIALIZACIÓN GLOBAL
   Se ejecuta cuando el DOM está completamente cargado.
   Detecta en qué página se encuentra y llama a la
   función de inicialización correspondiente.
-------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar presets de charset en todas las páginas
  initCharsetPresets();

  // Inicializar lógica específica según la página actual
  initCipherPage();   // Solo actúa si estamos en cifrar.html
  initDecryptPage();  // Solo actúa si estamos en descifrar.html
});