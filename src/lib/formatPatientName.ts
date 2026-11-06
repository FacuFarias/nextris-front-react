/**
 * Formats patient names for worklists. PACS commonly sends DICOM names as
 * SURNAME^GIVEN^MIDDLE, while RIS worklists already use a display string.
 */
export const formatPatientName = (value: string | null | undefined): string => {
    const text = value?.trim() || "";
    if (!text) return "—";

    if (text.includes(",")) {
        const [surname, ...nameParts] = text.split(",");
        return `${surname.trim()}, ${nameParts.join(",").trim()}`.replace(/, $/, ",");
    }

    if (text.includes("^")) {
        const [surname, ...nameParts] = text.split("^").map((part) => part.trim()).filter(Boolean);
        return surname && nameParts.length > 0
            ? `${surname}, ${nameParts.join(" ")}`
            : text.replace(/\^/g, " ");
    }

    return text;
};
