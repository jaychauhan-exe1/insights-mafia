'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Clock,
    Wallet,
    UserCircle,
    Briefcase,
    Banknote,
    Menu,
    ChevronRight,
    Bell,
    Settings,
    Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer } from 'vaul';
import { useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    iconName: string;
}

const iconMap: Record<string, any> = {
    Dashboard: LayoutDashboard,
    LayoutDashboard,
    Home,
    ClipboardList,
    Users,
    Clock,
    Wallet,
    UserCircle,
    Briefcase,
    Banknote,
    Menu
};

export function MobileNav({ items }: { items: NavItem[] }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // Filter items for the main bottom bar
    // User wants: Dashboard, tasks, approvals, then a menu button
    const isAdmin = items.some(item => item.href.includes('/admin/'));

    // Find the specific items requested by the user
    const dashboardItem = items.find(item => item.label === 'Dashboard');
    const tasksItem = items.find(item => item.label === 'Tasks');
    const approvalsItem = items.find(item => item.label === 'Approvals');

    const mainItems = isAdmin
        ? [dashboardItem, tasksItem, approvalsItem].filter(Boolean) as NavItem[]
        : items;

    const otherItems = isAdmin
        ? items.filter(item => !['Dashboard', 'Tasks', 'Approvals'].includes(item.label))
        : [];

    return (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] z-[100]">
            <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-[2.5rem] flex justify-between items-center h-[76px] px-3">
                {mainItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = iconMap[item.iconName] || iconMap[item.label] || Home;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-[52px] rounded-3xl transition-all duration-500 relative group mx-1",
                                isActive ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <div className="flex flex-col items-center justify-center gap-1.5">
                                <Icon className={cn("transition-all duration-300", isActive ? "w-5 h-5" : "w-5 h-5")} />
                                <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest transition-all duration-300",
                                    isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}

                {isAdmin && (
                    <Drawer.Root open={open} onOpenChange={setOpen}>
                        <Drawer.Trigger asChild>
                            <button className="flex flex-col items-center justify-center flex-1 h-[52px] rounded-3xl text-gray-400 hover:text-gray-600 transition-all duration-300 mx-1">
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                    <Menu className="w-5 h-5" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 h-0 overflow-hidden">Menu</span>
                                </div>
                            </button>
                        </Drawer.Trigger>
                        <Drawer.Portal>
                            <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]" />
                            <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] h-[60vh] fixed bottom-0 left-0 right-0 z-[120] outline-none shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.2)]">
                                <div className="p-4 bg-white rounded-t-[32px] flex-1 overflow-y-auto no-scrollbar touch-pan-y">
                                    <Drawer.Title className="sr-only">Admin Menu</Drawer.Title>
                                    <Drawer.Description className="sr-only">Administrative navigation tools</Drawer.Description>

                                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-8 mt-2" />
                                    <div className="max-w-md mx-auto space-y-6">
                                        <div className="grid grid-cols-1 gap-2 pb-10">
                                            {otherItems.map((item) => {
                                                const Icon = iconMap[item.iconName] || iconMap[item.label] || Home;
                                                const isActive = pathname === item.href;
                                                return (
                                                    <Drawer.Close asChild key={item.label}>
                                                        <Link
                                                            href={item.href}
                                                            className={cn(
                                                                "flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                                                                isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                                    isActive ? "bg-white/20" : "bg-white shadow-sm"
                                                                )}>
                                                                    <Icon className="w-5 h-5" />
                                                                </div>
                                                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                                            </div>
                                                            <ChevronRight className={cn("w-4 h-4 opacity-50", isActive && "opacity-100")} />
                                                        </Link>
                                                    </Drawer.Close>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </Drawer.Content>
                        </Drawer.Portal>
                    </Drawer.Root>
                )}
            </div>
        </div>
    );
}
