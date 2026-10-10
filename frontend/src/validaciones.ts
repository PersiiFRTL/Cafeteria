export function emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function contrasenaValida(password: string): boolean {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function numeroValido(
    valor: string | number,
    minimo: number,
    maximo = Number.POSITIVE_INFINITY,
    entero = false
): boolean {
    if (typeof valor === "string" && valor.trim() === "") {
        return false;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) &&
        numero >= minimo &&
        numero <= maximo &&
        (!entero || Number.isInteger(numero));
}

export function normalizarTexto(valor: string): string {
    return valor
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s_-]+/g, " ")
        .trim()
        .toLowerCase();
}

export function coincideBusqueda(valor: string, textoBusqueda: string): boolean {
    const texto = normalizarTexto(valor);
    const busqueda = normalizarTexto(textoBusqueda).trim();

    if (!busqueda) {
        return true;
    }

    if (!texto) {
        return false;
    }

    const palabras = texto.split(/\s+/).filter(Boolean);

    return palabras.some((palabra) =>
        palabra.startsWith(busqueda)
    );
}

export function formatearPrecio(valor: number): string {
    return new Intl.NumberFormat("es-AR", {
        maximumFractionDigits: 2
    }).format(valor);
}

export function parsearPrecio(valor: string): number | null {
    const texto = valor.trim();
    if (!texto || !/^[\d.,]+$/.test(texto)) {
        return null;
    }

    let normalizado = texto;
    if (texto.includes(",")) {
        const partes = texto.split(",");
        if (partes.length !== 2 || !/^\d+$/.test(partes[1])) {
            return null;
        }

        const entero = partes[0];
        if (entero.includes(".") && !/^\d{1,3}(\.\d{3})+$/.test(entero)) {
            return null;
        }
        normalizado = `${entero.replaceAll(".", "")}.${partes[1]}`;
    } else if (texto.includes(".")) {
        if (/^\d{1,3}(\.\d{3})+$/.test(texto)) {
            normalizado = texto.replaceAll(".", "");
        } else if (!/^\d+\.\d+$/.test(texto)) {
            return null;
        }
    }

    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
}
