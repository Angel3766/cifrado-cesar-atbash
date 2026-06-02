/* =============================================
   CRYPTOLAB — Lógica de Cifrado/Descifrado
   Archivo: js/crypto.js
   Descripción: Funciones matemáticas puras para
   los cifrados César y Atbash. No depende de la
   interfaz gráfica (DOM), puede usarse de forma
   independiente en cualquier página.
   ============================================= */


/* --------------------------------------------------
   OBTENER CONJUNTO DE CARACTERES
   Lee el input #charset del DOM, lo convierte a
   mayúsculas y lo retorna como arreglo de caracteres.

   @returns {string[]} Arreglo de caracteres válidos
-------------------------------------------------- */
function getCharset() {
  const raw = document.getElementById('charset').value;
  return raw.toUpperCase().split('');
}


/* --------------------------------------------------
   FUNCIÓN BASE DE PROCESAMIENTO DE TEXTO
   Recorre cada carácter del texto. Si el carácter
   pertenece al charset, aplica la función de mapeo.
   Si no pertenece (espacios, puntos, etc.) lo deja
   tal como está.

   @param {string}   text    - Texto a procesar
   @param {string[]} charset - Arreglo de caracteres válidos
   @param {Function} mapFn   - Función (índice, tamaño) → nuevo índice
   @returns {string} Texto procesado
-------------------------------------------------- */
function processText(text, charset, mapFn) {
  return text.toUpperCase().split('').map(char => {
    const index = charset.indexOf(char);
    // Si el carácter no está en el charset, se conserva sin cambios
    if (index === -1) return char;
    // Aplicar la función de mapeo y retornar el carácter resultante
    return charset[mapFn(index, charset.length)];
  }).join('');
}


/* --------------------------------------------------
   CIFRADO CÉSAR
   Desplaza cada carácter 'shift' posiciones hacia
   adelante dentro del charset.

   Fórmula matemática:
     E(x) = (x + shift) mod n

   Donde:
     x     = posición del carácter en el charset
     shift = módulo de desplazamiento (clave)
     n     = tamaño total del charset

   Ejemplo con shift=3, charset=ABCDEFGHIJKLMNOPQRSTUVWXYZ:
     A(0) → D(3)
     B(1) → E(4)
     Z(25) → C(2)  ← el desplazamiento envuelve al inicio

   @param {string}   text    - Texto en claro a cifrar
   @param {string[]} charset - Arreglo de caracteres válidos
   @param {number}   shift   - Módulo de desplazamiento (1 a n-1)
   @returns {string} Texto cifrado
-------------------------------------------------- */
function cesarEncrypt(text, charset, shift) {
  return processText(text, charset, (i, n) => (i + shift) % n);
}


/* --------------------------------------------------
   DESCIFRADO CÉSAR
   Invierte el desplazamiento: mueve cada carácter
   'shift' posiciones hacia atrás en el charset.

   Fórmula matemática:
     D(x) = (x - shift + n) mod n

   El "+ n" antes del módulo evita índices negativos
   en JavaScript cuando x < shift.

   Ejemplo con shift=3, charset=ABCDEFGHIJKLMNOPQRSTUVWXYZ:
     D(3) → A(0)
     E(4) → B(1)
     C(2) → Z(25)

   @param {string}   text    - Texto cifrado a descifrar
   @param {string[]} charset - Arreglo de caracteres válidos
   @param {number}   shift   - Módulo de desplazamiento usado al cifrar
   @returns {string} Texto descifrado
-------------------------------------------------- */
function cesarDecrypt(text, charset, shift) {
  return processText(text, charset, (i, n) => ((i - shift) % n + n) % n);
}


/* --------------------------------------------------
   CIFRADO / DESCIFRADO ATBASH
   Sustituye cada carácter por su simétrico opuesto
   dentro del charset. Es su propio inverso: aplicarlo
   dos veces regresa al texto original.

   Fórmula matemática:
     A(x) = (n - 1 - x)

   Donde:
     x = posición del carácter en el charset
     n = tamaño total del charset

   Ejemplo con charset=ABCDEFGHIJKLMNOPQRSTUVWXYZ (n=26):
     A(0)  → Z(25)
     B(1)  → Y(24)
     M(12) → N(13)
     Z(25) → A(0)

   Origen histórico: Cifrado hebreo donde Aleph (primera
   letra) se sustituye por Tav (última), de ahí "AT-BASH".

   @param {string}   text    - Texto a procesar (cifrar o descifrar)
   @param {string[]} charset - Arreglo de caracteres válidos
   @returns {string} Texto transformado
-------------------------------------------------- */
function atbashProcess(text, charset) {
  return processText(text, charset, (i, n) => n - 1 - i);
}


/* --------------------------------------------------
   ÍNDICE DE COINCIDENCIA (IC)
   Mide qué tan "natural" es un texto analizando la
   distribución de frecuencias de sus caracteres.

   Concepto desarrollado por Al-Kindi (s. IX d.C.)
   en su manuscrito sobre análisis de frecuencia, y
   formalizado matemáticamente por William Friedman en 1922.

   Un IC alto → distribución de frecuencias irregular
               → probable texto en lenguaje natural
   Un IC bajo → distribución uniforme
               → probable texto cifrado o aleatorio

   Fórmula matemática:
     IC = Σ [ f(c) × (f(c) - 1) ] / [ N × (N - 1) ]

   Donde:
     f(c) = frecuencia de aparición del carácter c
     N    = total de caracteres válidos en el texto

   Valores de referencia:
     Español: IC ≈ 0.077
     Inglés:  IC ≈ 0.065
     Texto aleatorio: IC ≈ 1/n

   @param {string}   text    - Texto a analizar
   @param {string[]} charset - Arreglo de caracteres válidos
   @returns {number} Valor del Índice de Coincidencia (0 a 1)
-------------------------------------------------- */
function scoreText(text, charset) {
  const freq = {};
  let total = 0;

  // Contar la frecuencia de cada carácter que pertenezca al charset
  for (const char of text) {
    if (charset.includes(char)) {
      freq[char] = (freq[char] || 0) + 1;
      total++;
    }
  }

  // Si hay menos de 2 caracteres válidos, el IC no es calculable
  if (total < 2) return 0;

  // Aplicar la fórmula del IC
  let ic = 0;
  for (const key in freq) {
    const f = freq[key];
    ic += f * (f - 1);
  }

  return ic / (total * (total - 1));
}


/* --------------------------------------------------
   DETECCIÓN AUTOMÁTICA DE CIFRADO
   Prueba todos los posibles módulos de César (fuerza
   bruta) y también Atbash, calculando el IC de cada
   resultado. El que produzca el IC más alto es el
   método más probable.

   Esta técnica es la implementación computacional del
   análisis de frecuencia descrito por Al-Kindi.

   @param {string}   ciphertext - Texto cifrado a analizar
   @param {string[]} charset    - Arreglo de caracteres válidos
   @returns {Object} Resultado con método, módulo, texto descifrado
                     y todos los módulos explorados
-------------------------------------------------- */
function autoDetectAndDecrypt(ciphertext, charset) {
  // --- 1. Probar Atbash ---
  const atbashResult = atbashProcess(ciphertext, charset);
  const atbashScore  = scoreText(atbashResult, charset);

  // --- 2. Probar todos los módulos posibles de César ---
  let bestShift  = 1;
  let bestScore  = -1;
  let bestResult = '';
  const allShifts = []; // Registro de todos los módulos explorados

  for (let s = 1; s < charset.length; s++) {
    const decrypted = cesarDecrypt(ciphertext, charset, s);
    const score     = scoreText(decrypted, charset);

    // Guardar resultado de este módulo
    allShifts.push({ shift: s, text: decrypted, score: score });

    // Actualizar el mejor módulo encontrado
    if (score > bestScore) {
      bestScore  = score;
      bestShift  = s;
      bestResult = decrypted;
    }
  }

  // --- 3. Determinar el método ganador ---
  // Si el IC de Atbash es mayor o igual al mejor César, se prefiere Atbash
  const isAtbash = atbashScore >= bestScore;

  return {
    method:      isAtbash ? 'atbash' : 'cesar',  // Método detectado
    shift:       isAtbash ? null : bestShift,     // Módulo (null si es Atbash)
    result:      isAtbash ? atbashResult : bestResult, // Texto descifrado
    score:       isAtbash ? atbashScore  : bestScore,  // IC del resultado
    allShifts:   allShifts,  // Todos los módulos César explorados
    atbashResult: atbashResult,
    atbashScore:  atbashScore
  };
}


/* --------------------------------------------------
   RENDERIZAR MAPA DE CARACTERES
   Genera la visualización HTML del mapeo de cada
   carácter según el método seleccionado.
   Se muestra en tiempo real mientras el usuario
   ajusta el módulo o cambia el método.

   @param {string}   method  - 'cesar' o 'atbash'
   @param {string[]} charset - Arreglo de caracteres válidos
   @param {number}   shift   - Módulo de desplazamiento (solo César)
   @param {string}   wrapId  - ID del elemento DOM donde renderizar
-------------------------------------------------- */
function renderCharMap(method, charset, shift, wrapId) {
  const wrap      = document.getElementById(wrapId);
  const MAX_CHARS = 20; // Máximo de caracteres a mostrar en la vista previa
  const preview   = charset.slice(0, Math.min(charset.length, MAX_CHARS));

  let html = '<div class="char-map">';

  preview.forEach((char, i) => {
    let mapped;

    if (method === 'atbash') {
      // Atbash: posición simétrica
      mapped = charset[charset.length - 1 - i];
    } else {
      // César: posición desplazada
      mapped = charset[(i + shift) % charset.length];
    }

    const isHighlight = (i === 0 || i === charset.length - 1);

    html += `
      <div class="char-pair ${isHighlight ? 'highlight' : ''}">
        <span class="orig">${char}</span>
        <span class="arrow">${method === 'atbash' ? '↕' : '↓'}</span>
        <span class="mapped">${mapped}</span>
      </div>`;
  });

  // Indicador de caracteres ocultos
  if (charset.length > MAX_CHARS) {
    html += `<span style="
      color: rgba(245,240,232,0.25);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      align-self: center;
      margin-left: 4px;">
      +${charset.length - MAX_CHARS} más
    </span>`;
  }

  // Etiqueta de módulo (solo para César)
  if (method === 'cesar') {
    html += `<span style="
      color: rgba(245,240,232,0.2);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.62rem;
      align-self: center;
      margin-left: 6px;">
      módulo ${shift}
    </span>`;
  }

  html += '</div>';
  wrap.innerHTML = html;
}


/* --------------------------------------------------
   COPIAR TEXTO AL PORTAPAPELES
   Intenta usar la API moderna de clipboard.
   Si no está disponible (HTTP sin HTTPS), usa el
   método alternativo con execCommand.

   @param {string} elementId - ID del textarea a copiar
-------------------------------------------------- */
function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  navigator.clipboard.writeText(el.value).catch(() => {
    // Fallback para navegadores sin soporte de Clipboard API
    el.select();
    document.execCommand('copy');
  });
}