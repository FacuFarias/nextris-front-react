const STUDY_MOTIVE_LABEL_RE = /(?:motivo|raz[oó]n)\s+(?:del\s+)?estudio\s*:/i;
const EXAMINATION_REASON_PREFIX_RE = /^\s*raz[oó]n\s+(?:del\s+)?estudio\s*:\s*/i;
const BRACKET_FIELD_RE = /\[\[([^\]]*)\]\]|\[([^[]*)\]/;

const escapeHtml = (value: string): string => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const hasMeaningfulTemplateText = (value: string): boolean => {
    const document = new DOMParser().parseFromString(value, 'text/html');
    return Boolean((document.body.textContent || '').replace(/\u200B/g, '').trim());
};

/** Keeps the template's complete reason section and fills only its motive. */
export const mergeTemplateStudyReason = (
    templateReason: string | null | undefined,
    examinationReason: string | null | undefined,
): string => {
    const template = String(templateReason || '');
    const reason = String(examinationReason || '')
        .trim()
        .replace(EXAMINATION_REASON_PREFIX_RE, '')
        .trim();

    if (!reason) return template;

    const escapedReason = escapeHtml(reason);
    const motiveParagraph = `<p><strong>Motivo del estudio: </strong>[[${escapedReason}]]</p>`;
    if (!hasMeaningfulTemplateText(template)) return motiveParagraph;

    const labelMatch = STUDY_MOTIVE_LABEL_RE.exec(template);
    if (!labelMatch || labelMatch.index === undefined) {
        return `${motiveParagraph}${template}`;
    }

    const labelEnd = labelMatch.index + labelMatch[0].length;
    const paragraphEnd = template.indexOf('</p>', labelEnd);
    const newlineEnd = template.indexOf('\n', labelEnd);
    const sectionEnds = [paragraphEnd, newlineEnd].filter((end) => end >= 0);
    const sectionEnd = sectionEnds.length > 0 ? Math.min(...sectionEnds) : template.length;
    const section = template.slice(labelEnd, sectionEnd);
    const placeholderMatch = BRACKET_FIELD_RE.exec(section);

    if (placeholderMatch && placeholderMatch.index !== undefined) {
        const placeholderStart = labelEnd + placeholderMatch.index;
        const placeholderEnd = placeholderStart + placeholderMatch[0].length;
        const usesDoubleBrackets = placeholderMatch[1] !== undefined;
        const replacement = usesDoubleBrackets
            ? `[[${escapedReason}]]`
            : `[${escapedReason}]`;
        return template.slice(0, placeholderStart) + replacement + template.slice(placeholderEnd);
    }

    const closingStrongMatch = /^\s*<\/strong\s*>/i.exec(section);
    const valueStart = closingStrongMatch
        ? labelEnd + closingStrongMatch[0].length
        : labelEnd;

    return template.slice(0, valueStart) + ` [[${escapedReason}]]` + template.slice(sectionEnd);
};
