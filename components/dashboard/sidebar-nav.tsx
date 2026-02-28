'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Clock,
    Wallet,
    UserCircle,
    Briefcase,
    Banknote,
    Home
} from 'lucide-react';

const icons: Record<string, any> = {
    LayoutDashboard,
    Home,
    ClipboardList,
    Users,
    Briefcase,
    Clock,
    Banknote,
    Wallet,
    UserCircle
};

interface SidebarNavProps {
    items: {
        label: string;
        href: string;
        iconName: string;
    }[];
}

export function SidebarNav({ items }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <div className="space-y-1">
            {items.map((item) => {
                const Icon = icons[item.iconName];
                // Check if active: exact match or if it's a subpage (except for main dashboard)
                const isActive = item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 group",
                            isActive
                                ? "text-primary bg-primary/10 shadow-sm"
                                : "text-muted-foreground hover:text-primary hover:bg-muted"
                        )}
                    >
                        {Icon && (
                            <Icon className={cn(
                                "w-[18px] h-[18px] transition-colors duration-300",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                            )} />
                        )}
                        {item.label}
                    </Link>
                );
            })}
        </div>
    );
}
