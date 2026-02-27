"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
    className,
    size = "default",
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
    size?: "sm" | "default"
}) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            data-size={size}
            className={cn(
                "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-800 shadow-sm",
                size === "default" ? "h-6 w-11" : "h-4 w-[1.75rem]",
                className
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform",
                    size === "default"
                        ? "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                        : "h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0"
                )}
            />
        </SwitchPrimitive.Root>
    )
}

export { Switch }

