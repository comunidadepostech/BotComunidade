export function describeError(error: unknown): string {
    const partes: string[] = [];
    let atual: unknown = error;

    while (atual instanceof Error) {
        const parte = `${atual.name}: ${atual.message}`;

        if (!partes.includes(parte)) partes.push(parte);

        atual = atual.cause;
    }

    if (partes.length === 0) return String(error);

    return partes.join(' <- ');
}
