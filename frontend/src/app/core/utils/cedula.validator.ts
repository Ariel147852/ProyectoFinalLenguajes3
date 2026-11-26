/**
 * Validador oficial de Cédula de Identidad Ecuatoriana (Algoritmo Módulo 10).
 *
 * Reglas:
 * 1. La cédula debe tener exactamente 10 dígitos numéricos (solo números, sin letras).
 * 2. No se permiten secuencias de dígitos repetidos (ej: 0000000000, 1111111111).
 * 3. Los dos primeros dígitos corresponden a la provincia (01 a 24 o 30).
 * 4. El tercer dígito debe ser menor a 6 (personas naturales).
 * 5. Coeficientes [2, 1, 2, 1, 2, 1, 2, 1, 2] con algoritmo Módulo 10.
 */
export const validarCedulaEcuatoriana = (cedula: string): { valida: boolean; mensaje?: string } => {
  if (!cedula || typeof cedula !== 'string') {
    return { valida: false, mensaje: 'La cédula es requerida' };
  }

  const clean = cedula.trim();

  if (!/^\d+$/.test(clean)) {
    return { valida: false, mensaje: 'Solo se permiten números (sin letras ni caracteres especiales)' };
  }

  if (clean.length !== 10) {
    return { valida: false, mensaje: `Debe contener exactamente 10 dígitos numéricos (actualmente tiene ${clean.length})` };
  }

  // Descartar dígitos idénticos repetidos
  if (/^(\d)\1{9}$/.test(clean)) {
    return { valida: false, mensaje: 'Cédula inválida (dígitos repetidos)' };
  }

  const provincia = parseInt(clean.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valida: false, mensaje: 'Código de provincia inválido (01 a 24 o 30)' };
  }

  const tercerDigito = parseInt(clean.charAt(2), 10);
  if (tercerDigito >= 6) {
    return { valida: false, mensaje: 'Tercer dígito para persona natural debe ser menor a 6 (del 0 al 5)' };
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    const digito = parseInt(clean.charAt(i), 10);
    let producto = digito * coeficientes[i];
    if (producto >= 10) {
      producto -= 9;
    }
    suma += producto;
  }

  const residuo = suma % 10;
  const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;
  const decimoDigito = parseInt(clean.charAt(9), 10);

  if (digitoVerificador !== decimoDigito) {
    return { valida: false, mensaje: 'Dígito verificador incorrecto. Cédula no válida.' };
  }

  return { valida: true };
};

