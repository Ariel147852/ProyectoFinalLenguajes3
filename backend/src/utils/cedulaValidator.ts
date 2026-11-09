/**
 * Validador oficial de Cédula de Identidad de la República del Ecuador (Algoritmo Módulo 10).
 *
 * Reglas:
 * 1. La cédula debe tener exactamente 10 dígitos numéricos.
 * 2. Los dos primeros dígitos corresponden a la provincia (01 a 24) o 30 para ecuatorianos en el exterior.
 * 3. El tercer dígito debe ser menor a 6 (personas naturales).
 * 4. Coeficientes [2, 1, 2, 1, 2, 1, 2, 1, 2]: multiplicar cada dígito; si el producto es >= 10, restar 9.
 * 5. La suma modulo 10 define el décimo dígito verificador.
 */
export const validarCedulaEcuatoriana = (cedula: string): { valida: boolean; mensaje?: string } => {
  if (!cedula || typeof cedula !== 'string') {
    return { valida: false, mensaje: 'La cédula es obligatoria' };
  }

  const cleanCedula = cedula.trim();

  if (!/^\d{10}$/.test(cleanCedula)) {
    return { valida: false, mensaje: 'La cédula debe contener exactamente 10 dígitos numéricos' };
  }

  const provincia = parseInt(cleanCedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valida: false, mensaje: 'El código de provincia de la cédula no es válido (01-24 o 30)' };
  }

  const tercerDigito = parseInt(cleanCedula.charAt(2), 10);
  if (tercerDigito >= 6) {
    return { valida: false, mensaje: 'El tercer dígito de la cédula para persona natural debe ser menor a 6' };
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

