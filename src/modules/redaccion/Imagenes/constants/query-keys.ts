export const imageFilterPresetKeys = {
  all: ["image-filter-presets"] as const,
  list: () => [...imageFilterPresetKeys.all, "list"] as const,
}
