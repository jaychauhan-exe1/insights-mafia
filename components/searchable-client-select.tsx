'use client';

import * as React from "react";
import { Check, ChevronsUpDown, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Client {
    id: string;
    name: string;
}

export function SearchableClientSelect({
    clients,
    value,
    onValueChange
}: {
    clients: Client[],
    value: string,
    onValueChange: (val: string) => void
}) {
    const [open, setOpen] = React.useState(false);

    const selectedClient = clients.find((client) => client.id === value);

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full h-12 justify-between bg-gray-50 border-none rounded-lg px-4 hover:bg-gray-100 transition-all font-medium text-gray-700"
                    >
                        {value ? (
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" />
                                <span className="font-bold">{selectedClient?.name}</span>
                            </div>
                        ) : (
                            <span className="text-gray-400">Search Client...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg border-gray-100 shadow-2xl overflow-hidden" align="start">
                    <Command className="rounded-none border-none">
                        <CommandInput placeholder="Search client name..." className="h-12 border-none focus:ring-0 font-medium" />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty className="py-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No client found.</CommandEmpty>
                            <CommandGroup>
                                {clients.map((client) => (
                                    <CommandItem
                                        key={client.id}
                                        value={client.name}
                                        onSelect={() => {
                                            onValueChange(client.id === value ? "" : client.id);
                                            setOpen(false);
                                        }}
                                        className="flex items-center justify-between py-3 px-4 rounded-xl cursor-pointer aria-selected:bg-primary/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-aria-selected:text-primary">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-sm text-gray-700">{client.name}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "h-4 w-4 text-primary",
                                                value === client.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
