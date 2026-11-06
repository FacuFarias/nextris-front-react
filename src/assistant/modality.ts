type Modality = { guid: string; description: string; externalcode: string };

function normalized(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Resolve common clinical names to the current catalogue's codes. The catalogue
// remains authoritative: no GUID or display label is hardcoded here.
export function resolveAssistantModality(input: string, choices: Modality[]): string | undefined {
    const wanted = normalized(input);
    if (!wanted) return '';
    const aliases: Record<string, string[]> = {
        mr: ['mr', 'rmn'],
        mri: ['mr', 'rmn'],
        rmn: ['mr', 'rmn'],
        resonancia: ['mr', 'rmn'],
        resonancias: ['mr', 'rmn'],
        'resonancia magnetica': ['mr', 'rmn'],
        'resonancias magneticas': ['mr', 'rmn'],
        us: ['us'],
        eco: ['us'],
        ecografia: ['us'],
        ecografias: ['us'],
        ultrasonido: ['us'],
        ultrasonidos: ['us'],
        ultrasonografia: ['us'],
        ultrasonografias: ['us'],
        ct: ['ct', 'tc'],
        tc: ['ct', 'tc'],
        tac: ['ct', 'tc'],
        tomografia: ['ct', 'tc'],
        tomografias: ['ct', 'tc'],
    };
    const wantedCodes = aliases[wanted];
    if (wantedCodes) {
        const found = wantedCodes
            .map(code => choices.find(choice => normalized(choice.externalcode) === code))
            .find(Boolean);
        if (found) return found.guid;
    }
    const exact = choices.find(choice => [choice.description, choice.externalcode].some(value => normalized(value) === wanted));
    if (exact) return exact.guid;
    const partial = choices.find(choice => normalized(choice.description).includes(wanted));
    return partial?.guid;
}
