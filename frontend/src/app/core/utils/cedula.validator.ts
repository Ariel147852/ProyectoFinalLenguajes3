/**
 * Validador oficial de Cédula de Identidad Ecuatoriana (Algoritmo Módulo 10).
 */
export const validarCedulaEcuatoriana = (cedula: string): { valida: boolean; mensaje?: string } => {
  if (!cedula || typeof cedula !== 'string') {
    return { valida: false, mensaje: 'La cédula es requerida' };
  }

  const clean = cedula.trim();

  if (!/^\d{10}$/.test(clean)) {
    return { valida: false, mensaje: 'Debe contener exactamente 10 dígitos numéricos' };
  }

  const provincia = parseInt(clean.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valida: false, mensaje: 'Código de provincia inválido (01 a 24 o 30)' };
  }

  const tercerDigito = parseInt(clean.charAt(2), 10);
  if (tercerDigito >= 6) {
    return { valida: false, mensaje: 'Tercer dígito debe ser menor a 6' };
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
