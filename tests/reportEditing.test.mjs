import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/assistant/reportEditing.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { readReportBlocks, applyReportEdits } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function editor(text, options = {}) {
    const node = {
        isTextblock: true, textContent: text, nodeSize: text.length + 2,
        type: { name: 'paragraph' },
        content: { content: [{ isText: !options.protected }] },
        forEach(callback) { callback({ isText: !options.protected }); },
        descendants(callback) { if (options.protected) callback({ type: { name: 'image' } }); },
    };
    const dispatches = [];
    return {
        state: {
            doc: { descendants(callback) { callback(node, 0); } },
            get tr() { return {
                ops: [], insertText(value, from, to) { this.ops.push({ value, from, to }); return this; },
                insert(pos, value) { this.ops.push({ pos, value }); return this; },
            }; },
            schema: { text: value => value, nodes: { paragraph: { create: (_attrs, value) => value } } },
        },
        view: { dispatch(tr) { dispatches.push(tr.ops); }, dom: { querySelectorAll() { return []; } } },
        dispatches,
    };
}

function three(a, b, c) { return { study_reason: editor(a), content: editor(b), conclusion: editor(c) }; }

test('context redacts known identity and rejects uncertain numeric identifiers', () => {
    const editors = three('Paciente Roxana Romero, cefalea', 'Sin lesiones', 'Normal');
    const fields = readReportBlocks(editors, ['Roxana Romero']);
    assert.equal(fields.study_reason[0].text.includes('Roxana'), false);
    assert.equal(fields.study_reason[0].text.includes('Romero'), false);
    assert.equal(readReportBlocks(three('Cefalea', 'Patient ID 12345678', 'Normal'), []), null);
});

test('images are excluded and a bad target rejects the whole edit batch', () => {
    const editors = three('Motivo', 'Sin lesiones', 'Normal');
    editors.conclusion = editor('imagen clínica', { protected: true });
    const blocks = readReportBlocks(editors, []);
    assert.deepEqual(blocks.conclusion[0], { blockId: 'conclusion:0', kind: 'protected', text: '', placeholders: [] });
    const result = applyReportEdits(editors, [
        { field: 'content', blockId: 'content:0', operation: 'replace_text', expectedText: 'Sin lesiones', text: 'Lesión focal' },
        { field: 'conclusion', blockId: 'conclusion:0', operation: 'replace_text', expectedText: 'imagen', text: 'Cambio' },
    ]);
    assert.equal(result.status, 'protected_block');
    assert.equal(editors.content.dispatches.length, 0);
});

test('exact phrase replacement retains the rest of the block', () => {
    const editors = three('Motivo', 'No hay lesión. Resto normal.', 'Impresiones: []');
    const result = applyReportEdits(editors, [{ field: 'content', blockId: 'content:0', operation: 'replace_text', expectedText: 'No hay lesión', text: 'Lesión focal' }]);
    assert.equal(result.status, 'ok');
    assert.deepEqual(editors.content.dispatches[0], [{ value: 'Lesión focal', from: 1, to: 14 }]);
});

test('one batch updates findings and impressions without changing other fields', () => {
    const editors = three('Motivo original', 'Hallazgos: sin lesión', 'Impresiones: normal');
    const result = applyReportEdits(editors, [
        { field: 'content', blockId: 'content:0', operation: 'replace_text', expectedText: 'sin lesión', text: 'edema leve' },
        { field: 'conclusion', blockId: 'conclusion:0', operation: 'replace_text', expectedText: 'normal', text: 'edema leve' },
    ]);
    assert.equal(result.status, 'ok');
    assert.equal(result.editCount, 2);
    assert.equal(editors.study_reason.dispatches.length, 0);
    assert.equal(editors.content.dispatches[0][0].value, 'edema leve');
    assert.equal(editors.conclusion.dispatches[0][0].value, 'edema leve');
});

test('accented edits remain intact and corrupted characters reject the whole batch', () => {
    const editors = three('Motivo', 'Sin lesión', 'Impresiones: []');
    const changes = [
        { field: 'content', blockId: 'content:0', operation: 'replace_text', expectedText: 'Sin lesión', text: 'Lesión ósea y descalcificación' },
        { field: 'conclusion', blockId: 'conclusion:0', operation: 'replace_text', expectedText: '[]', text: 'Descalcificaci\uFFFDn ósea' },
    ];
    assert.equal(applyReportEdits(editors, changes).status, 'invalid_encoding');
    assert.equal(editors.content.dispatches.length, 0);
    assert.equal(editors.conclusion.dispatches.length, 0);
    assert.equal(applyReportEdits(editors, [changes[0]]).status, 'ok');
    assert.equal(editors.content.dispatches[0][0].value, 'Lesión ósea y descalcificación');
});

test('two separate phrases in one block can change together, overlapping changes cannot', () => {
    const editors = three('Motivo', 'Sin lesión y sin edema', 'Impresiones: []');
    const changes = [
        { field: 'content', blockId: 'content:0', operation: 'replace_text', expectedText: 'Sin lesión', text: 'Lesión focal' },
        { field: 'content', blockId: 'content:0', operation: 'replace_text', expectedText: 'sin edema', text: 'edema leve' },
    ];
    assert.equal(applyReportEdits(editors, changes).status, 'ok');
    assert.equal(editors.content.dispatches[0].length, 2);
    const conflicted = three('Motivo', 'Sin lesión y sin edema', 'Impresiones: []');
    assert.equal(applyReportEdits(conflicted, [changes[0], { ...changes[0], expectedText: 'lesión' }]).status, 'overlapping_edits');
    assert.equal(conflicted.content.dispatches.length, 0);
});

test('template placeholders and ordinary contradictory phrases are exposed as separate text', () => {
    const editors = three('Motivo: [Indicación]', 'Hallazgos: Sin lesión. [Describir hallazgo]', 'Impresiones: [[]]');
    const fields = readReportBlocks(editors, []);
    assert.equal(fields.content[0].text.includes('Sin lesión'), true);
    assert.deepEqual(fields.content[0].placeholders, ['[Describir hallazgo]']);
    assert.deepEqual(fields.conclusion[0].placeholders, ['[[]]']);
});
