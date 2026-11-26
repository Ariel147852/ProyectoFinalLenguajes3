/**
 * Validador oficial de Cédula de Identidad de la República del Ecuador (Algoritmo Módulo 10).
 *
 * Reglas:
 * 1. La cédula debe tener exactamente 10 dígitos numéricos (solo números, sin letras ni símbolos).
 * 2. No se permiten números repetitivos inválidos (ej: 0000000000, 1111111111).
 * 3. Los dos primeros dígitos corresponden a la provincia (01 a 24) o 30 para ecuatorianos en el exterior.
 * 4. El tercer dígito debe ser menor a 6 (personas naturales: 0, 1, 2, 3, 4, 5).
 * 5. Coeficientes [2, 1, 2, 1, 2, 1, 2, 1, 2]: multiplicar cada dígito; si el producto es >= 10, restar 9.
 * 6. La suma módulo 10 define el décimo dígito verificador.
 */
export const validarCedulaEcuatoriana = (cedula: string): { valida: boolean; mensaje?: string } => {
  if (!cedula || typeof cedula !== 'string') {
    return { valida: false, mensaje: 'La cédula es obligatoria' };
  }

  const cleanCedula = cedula.trim();

  // Validar que solo contenga números y exactamente 10 dígitos
  if (!/^\d+$/.test(cleanCedula)) {
    return { valida: false, mensaje: 'La cédula debe contener solo números, no se admiten letras ni caracteres especiales' };
  }

  if (cleanCedula.length !== 10) {
    return { valida: false, mensaje: `La cédula debe tener exactamente 10 números (se ingresaron ${cleanCedula.length})` };
  }

  // Descartar números con todos los dígitos idénticos
  if (/^(\d)\1{9}$/.test(cleanCedula)) {
    return { valida: false, mensaje: 'La cédula no puede contener todos los dígitos repetidos' };
  }

  const provincia = parseInt(cleanCedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valida: false, mensaje: 'El código de provincia de la cédula no es válido (debe ser del 01 al 24 o 30)' };
  }

  const tercerDigito = parseInt(cleanCedula.charAt(2), 10);
  if (tercerDigito >= 6) {
    return { valida: false, mensaje: 'El tercer dígito de la cédula para persona natural debe ser menor a 6 (del 0 al 5)' };
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    const digito = parseInt(cleanCedula.charAt(i), 10);
    let producto = digito * coeficientes[i];
    if (producto >= 10) {
      producto -= 9;
    }
    suma += producto;
  }

  const residuo = suma % 10;
  const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;
  const decimoDigito = parseInt(cleanCedula.charAt(9), 10);

  if (digitoVerificador !== decimoDigito) {
    return {
      valida: false,
      mensaje: 'El dígito verificador de la cédula es incorrecto. Ingrese una cédula ecuatoriana válida.'
    };
  }

  return { valida: true };
};

