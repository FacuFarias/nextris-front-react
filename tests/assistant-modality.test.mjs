import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/assistant/modality.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64');
const { resolveAssistantModality } = await import(moduleUrl);

test('clinical modality aliases use catalogue IDs without accepting invented IDs', () => {
    const choices = [
        { guid: 'resonancia-guid', description: 'RESONANCIA MAGNÉTICA', externalcode: 'RMN' },
        { guid: 'ultrasonido-guid', description: 'ULTRASONIDO', externalcode: 'US' },
        { guid: 'tomografia-guid', description: 'TOMOGRAFÍA', externalcode: 'CT' },
    ];
    for (const input of ['MR', 'MRI', 'RMN', 'resonancias', 'resonancia magnética']) {
        assert.equal(resolveAssistantModality(input, choices), 'resonancia-guid');
    }
    for (const input of ['US', 'ultrasonidos', 'ecografías']) {
        assert.equal(resolveAssistantModality(input, choices), 'ultrasonido-guid');
    }
    assert.equal(resolveAssistantModality('TAC', choices), 'tomografia-guid');
    assert.equal(resolveAssistantModality('modalidad desconocida', choices), undefined);
});
