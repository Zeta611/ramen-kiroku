import { Badge } from "@/components/ui/badge"
import { STYLE_CHIP_CLASSES, STYLE_LABELS, type RamenStyle } from "@/lib/ramen"
import { cn } from "@/lib/utils"

export function StyleChip({ style }: { style: RamenStyle }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-none tracking-widest uppercase",
        STYLE_CHIP_CLASSES[style]
      )}
    >
      {STYLE_LABELS[style]}
    </Badge>
  )
}
