import type { Editor } from '@tiptap/react';

export type ReportField = 'study_reason' | 'content' | 'conclusion';
export type ReportEdit = { field: ReportField; blockId: string; operation: 'replace_text' | 'append_text' | 'insert_paragraph_after'; expectedText?: string; text: string };
export const REPORT_FIELDS: ReportField[] = ['study_reason', 'content', 'conclusion'];
export type ReportEditors = Record<ReportField, Editor | null>;

const suspect = /\b\d{7,10}\b|NR\d{8}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b[0-9a-f]{8}-[0-9a-f-]{27,}\b|\b\d{5,}[_-]\d+\b|(?:\d[ .-]?){11,}/i;
const esc = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function reportSnapshot(editors: ReportEditors) {
    return Object.fromEntries(REPORT_FIELDS.map(field => [field, editors[field]?.getHTML() || ''])) as Record<ReportField, string>;
}

export function readReportBlocks(editors: ReportEditors, identity: unknown[]) {
    const needles = identity.flatMap((value, index) => {
        const text = String(value || '');
        return index === 0 ? [text, ...text.split(/[\s^,]+/)] : [text];
    }).map(value => value.trim()).filter(value => value.length >= 3);
    const fields = {} as Record<ReportField, Array<{ blockId: string; kind: string; text: string; placeholders: string[] }>>;
    let totalBytes = 0;
    for (const field of REPORT_FIELDS) {
        const editor = editors[field];
        if (!editor) return null;
        const blocks: typeof fields[ReportField] = [];
        let index = 0;
        let unsafe = false;
        editor.state.doc.descendants((node) => {
            if (!node.isTextblock) return true;
            const text = node.textContent;
            const protectedContent = (() => { let found = false; node.descendants(child => { if (child.type.name === 'image' || child.type.name === 'variableChip' || child.type.name === 'criterionChip') found = true; }); return found; })();
            if (protectedContent) {
                blocks.push({ blockId: `${field}:${index++}`, kind: 'protected', text: '', placeholders: [] });
                return false;
            }
            let cleaned = text;
            for (const needle of needles) cleaned = cleaned.replace(new RegExp(esc(needle), 'gi'), '[IDENTIFICADOR]');
            totalBytes += new TextEncoder().encode(cleaned).length;
            if (cleaned.length > 6000 || totalBytes > 128 * 1024) unsafe = true;
            if (suspect.test(cleaned)) unsafe = true;
            const placeholders = cleaned.match(/\[\[[^\]]*\]\]|\[[^\]]+\]/g) || [];
            blocks.push({ blockId: `${field}:${index++}`, kind: node.type.name === 'heading' ? 'heading' : 'paragraph', text: cleaned, placeholders });
            return false;
        });
        if (unsafe || blocks.length > 200) return null;
        fields[field] = blocks;
    }
    return fields;
}

function locate(editor: Editor, edit: ReportEdit) {
    const match = edit.blockId.match(/^(study_reason|content|conclusion):(\d+)$/);
    if (!match || match[1] !== edit.field) return null;
    const wanted = Number(match[2]);
    let index = 0;
    let found: { pos: number; node: Editor['state']['doc'] } | null = null;
    editor.state.doc.descendants((node, pos) => {
        if (!node.isTextblock) return true;
        if (index++ === wanted) found = { pos, node };
        return false;
    });
    return found as { pos: number; node: Editor['state']['doc'] } | null;
}

export function applyReportEdits(editors: ReportEditors, edits: ReportEdit[]) {
    if (!edits.length || edits.length > 8) return { status: 'invalid_edit' };
    const planned: Array<{ field: ReportField; from: number; to: number; text: string; operation: ReportEdit['operation'] }> = [];
    for (const edit of edits) {
        const editor = editors[edit.field];
        if (typeof edit.text === 'string' && edit.text.includes('\uFFFD')) return { status: 'invalid_encoding' };
        if (!editor || typeof edit.text !== 'string' || !edit.text.trim() || edit.text.length > 4000 || suspect.test(edit.text)) return { status: 'invalid_edit' };
        const block = locate(editor, edit);
        if (!block) return { status: 'invalid_block' };
        const { node, pos } = block;
        const blockText = node.textContent as string;
        let protectedContent = false;
        node.forEach(child => { if (!child.isText) protectedContent = true; });
        if (protectedContent) return { status: 'protected_block' };
        if (edit.operation === 'replace_text') {
            if (!edit.expectedText || edit.expectedText.length > 2000) return { status: 'invalid_edit' };
            const start = blockText.indexOf(edit.expectedText);
            if (start < 0 || blockText.indexOf(edit.expectedText, start + 1) >= 0) return { status: 'text_not_unique' };
            planned.push({ field: edit.field, from: pos + 1 + start, to: pos + 1 + start + edit.expectedText.length, text: edit.text, operation: edit.operation });
        } else if (edit.operation === 'append_text') {
            planned.push({ field: edit.field, from: pos + node.nodeSize - 1, to: pos + node.nodeSize - 1, text: edit.text, operation: edit.operation });
        } else if (edit.operation === 'insert_paragraph_after') {
            planned.push({ field: edit.field, from: pos + node.nodeSize, to: pos + node.nodeSize, text: edit.text, operation: edit.operation });
        } else return { status: 'invalid_edit' };
    }
    for (let first = 0; first < planned.length; first += 1) {
        for (let second = first + 1; second < planned.length; second += 1) {
            const a = planned[first];
            const b = planned[second];
            if (a.field !== b.field) continue;
            if ((a.from < b.to && b.from < a.to) || (a.from === b.from && a.to === b.to)) return { status: 'overlapping_edits' };
        }
    }
    for (const field of REPORT_FIELDS) {
        const editor = editors[field];
        const changes = planned.filter(item => item.field === field).sort((a, b) => b.from - a.from);
        if (!editor || !changes.length) continue;
        const tr = editor.state.tr;
        for (const change of changes) {
            if (change.operation === 'insert_paragraph_after') tr.insert(change.from, editor.state.schema.nodes.paragraph.create(null, editor.state.schema.text(change.text)));
            else tr.insertText(change.text, change.from, change.to);
        }
        editor.view.dispatch(tr);
    }
    edits.forEach((edit, position) => {
        const editor = editors[edit.field];
        const index = Number(edit.blockId.split(':')[1]);
        const element = editor?.view.dom.querySelectorAll('p,h1,h2,h3,h4,h5,h6')[index] as HTMLElement | undefined;
        if (position === 0) element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        element?.animate([{ backgroundColor: 'rgba(147,51,234,.35)', outline: '2px solid #9333ea' }, { backgroundColor: 'transparent', outline: '2px solid transparent' }], { duration: 1800 });
    });
    return { status: 'ok', editCount: edits.length };
}
