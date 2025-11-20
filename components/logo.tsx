import { cn } from "@/lib/utils"

type AppLogoProps = {
  className?: string
  withWordmark?: boolean
  direction?: "row" | "column"
}

export function AppLogo({
  className,
  withWordmark = true,
  direction = "row",
}: AppLogoProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-foreground",
        direction === "column" && "flex-col items-start gap-1.5",
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card">
        <div className="flex flex-col gap-1">
          <span className="block h-1.5 w-6 rounded-sm bg-[#4A5568]" />
          <span className="block h-1.5 w-4 rounded-sm bg-[#2D3748]" />
          <span className="block h-1.5 w-5 rounded-sm bg-[#3182CE]" />
        </div>
      </div>

      {withWordmark && (
        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Crivus
          </p>
          <p className="text-sm font-semibold text-foreground">Quiz Analytics</p>
        </div>
      )}
    </div>
  )
}

