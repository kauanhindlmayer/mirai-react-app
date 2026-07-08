import { TrashIcon } from "lucide-react"

import { InlineEditableCell } from "@/components/tags/inline-editable-cell"
import { TagColorPicker } from "@/components/tags/tag-color-picker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getErrorMessage } from "@/lib/utils"
import type { Tag } from "@/types/tags"

const COLUMN_COUNT = 6

type TagsTableProps = {
  tags: Tag[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  selectedIds: Set<string>
  onToggleSelected: (tagId: string) => void
  onUpdateField: (
    tag: Tag,
    field: "name" | "description" | "color",
    value: string
  ) => void
  onDeleteTag: (tagId: string) => void
}

export function TagsTable({
  tags,
  isLoading,
  isError,
  error,
  onRetry,
  selectedIds,
  onToggleSelected,
  onUpdateField,
  onDeleteTag,
}: TagsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="w-10" />
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Work items</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="h-24">
                <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <span className="text-sm">{getErrorMessage(error)}</span>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    Try again
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-muted-foreground"
              >
                Loading…
              </TableCell>
            </TableRow>
          ) : tags.length > 0 ? (
            tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(tag.id)}
                    onCheckedChange={() => onToggleSelected(tag.id)}
                    aria-label={`Select ${tag.name}`}
                  />
                </TableCell>
                <TableCell>
                  <TagColorPicker
                    color={tag.color}
                    onChange={(color) => onUpdateField(tag, "color", color)}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditableCell
                    value={tag.name}
                    onSave={(value) => onUpdateField(tag, "name", value)}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditableCell
                    value={tag.description ?? ""}
                    onSave={(value) => onUpdateField(tag, "description", value)}
                    placeholder="Add a description"
                  />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {tag.workItemsCount}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onDeleteTag(tag.id)}
                    aria-label={`Delete ${tag.name}`}
                  >
                    <TrashIcon className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-muted-foreground"
              >
                No tags yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
