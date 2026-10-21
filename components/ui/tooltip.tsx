"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

/**
 * Shares hover timing between tooltips: the first one waits `delay` ms,
 * then neighbours open instantly until the pointer has been away for `timeout` ms.
 * One provider wraps the app; nest another to give a section its own group.
 */
function TooltipProvider({
  delay = 300,
  closeDelay = 0,
  timeout = 400,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      closeDelay={closeDelay}
      timeout={timeout}
      {...props}
    />
  )
}

function TooltipRoot({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  className,
  positionerClassName,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "side" | "sideOffset" | "align" | "alignOffset"
  > & {
    positionerClassName?: string
  }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        className={cn("isolate z-[300] outline-none", positionerClassName)}
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            // Blur + fade on the first open and the final close; switching within a group is instant (data-instant)
            "pointer-events-none select-none origin-(--transform-origin) rounded-lg border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-lg",
            "transition-[opacity,filter,scale] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "data-starting-style:opacity-0 data-starting-style:blur-[3px] data-starting-style:scale-95",
            "data-ending-style:opacity-0 data-ending-style:blur-[3px] data-ending-style:scale-95 data-ending-style:duration-150",
            "data-instant:transition-none",
            className
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

/**
 * Convenience wrapper: `<Tooltip content="Label"><button … /></Tooltip>`.
 * The child must be a single element that accepts a ref and event props.
 */
function Tooltip({
  content,
  children,
  side,
  sideOffset,
  align,
  disabled,
  contentClassName,
}: {
  content: React.ReactNode
  children: React.ReactElement
  side?: TooltipPrimitive.Positioner.Props["side"]
  sideOffset?: number
  align?: TooltipPrimitive.Positioner.Props["align"]
  disabled?: boolean
  contentClassName?: string
}) {
  return (
    <TooltipRoot disabled={disabled}>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} sideOffset={sideOffset} align={align} className={contentClassName}>
        {content}
      </TooltipContent>
    </TooltipRoot>
  )
}

export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
