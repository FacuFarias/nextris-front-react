import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Tag } from "@/modules/configuracion/configuracion-tablas/institucional/tags";

const TAG_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6'];
const tagColor = (guid: string) => TAG_COLORS[guid.charCodeAt(0) % TAG_COLORS.length];

interface TagsCellProps {
  examId: string;
  currentTagIds: string[];
  availableTags: Tag[];
  onUpdate: (examId: string, tagIds: string[]) => void;
  isUpdating?: boolean;
}

export const TagsCell = ({
  examId,
  currentTagIds,
  availableTags,
  onUpdate,
  isUpdating,
}: TagsCellProps) => {
  const [open, setOpen] = useState(false);

  const toggle = (tagId: string) => {
    const next = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    onUpdate(examId, next);
  };

  const activeTags = availableTags.filter((t) => currentTagIds.includes(t.guid));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 flex-wrap cursor-pointer min-w-5 min-h-5 focus:outline-none hover:opacity-80 transition-opacity"
          title="Gestionar tags"
          disabled={isUpdating}
          onClick={(e) => e.stopPropagation()}
        >
          {activeTags.length === 0 ? (
            <span className="inline-block w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
          ) : (
            activeTags.map((tag) => (
              <span
                key={tag.guid}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${tagColor(tag.guid)}22`, color: tagColor(tag.guid) }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0 dark:bg-gray-700"
                  style={{ backgroundColor: tagColor(tag.guid) }}
                />
                {tag.description}
              </span>
            ))
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 max-w-xs"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide dark:text-gray-200">Tags</p>
        {availableTags.length === 0 ? (
          <p className="text-xs text-gray-400">No hay tags disponibles para esta institución.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {availableTags.map((tag) => {
              const active = currentTagIds.includes(tag.guid);
              const color = tagColor(tag.guid);
              return (
                <button
                  key={tag.guid}
                  title={tag.description}
                  disabled={isUpdating}
                  onClick={() => toggle(tag.guid)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-all
                    ${active ? "ring-2 ring-offset-1 bg-gray-50 font-semibold" : "opacity-50 hover:opacity-90"}
                    disabled:cursor-not-allowed`}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-700 dark:text-gray-200">{tag.description}</span>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
