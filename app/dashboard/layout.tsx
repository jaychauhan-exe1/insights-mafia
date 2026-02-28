import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/get-profile';
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Clock,
    Wallet,
    UserCircle,
    LogOut,
    Home,
    ArrowLeftRight,
    Briefcase,
    Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth';
import Image from 'next/image';
import { MobileNav } from '@/components/mobile-nav';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getProfile();

    if (!profile) {
        const session = await getSession();
        if (session?.user) {
            redirect('/login');
        }
        redirect('/login');
    }

    const navigation = [
        { label: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' },
        { label: 'Tasks', href: '/dashboard/tasks', iconName: 'ClipboardList' },
    ];

    if (profile.role === 'Admin') {
        navigation.push({ label: 'Team', href: '/dashboard/admin/users', iconName: 'Users' });
        navigation.push({ label: 'Clients', href: '/dashboard/admin/clients', iconName: 'Briefcase' });
        navigation.push({ label: 'Attendance', href: '/dashboard/admin/attendance', iconName: 'Clock' });
        navigation.push({ label: 'Approvals', href: '/dashboard/admin/approvals', iconName: 'Banknote' });
        navigation.push({ label: 'Finances', href: '/dashboard/admin/payments', iconName: 'Wallet' });
    } else if (profile.role === 'Employee') {
        navigation.push({ label: 'Attendance', href: '/dashboard/employee/attendance', iconName: 'Clock' });
    } else if (profile.role === 'Freelancer') {
        navigation.push({ label: 'Wallet', href: '/dashboard/freelancer/wallet', iconName: 'Wallet' });
    }

    navigation.push({ label: 'Account', href: '/dashboard/account', iconName: 'UserCircle' });

    return (
        <div className="flex min-h-screen bg-background font-sans antialiased text-foreground">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex w-[260px] fixed inset-y-0 bg-white border-r border-border flex-col z-50">
                <div className="p-6 mb-2 flex items-center gap-3">
                    <Image src="/assets/logo.png" alt="Logo" width={500} height={40} className=" w-2/3 h-full" />
                </div>

                <nav className="flex-1 px-3 overflow-y-auto">
                    <SidebarNav items={navigation} />
                </nav>

                <div className="p-6 border-t border-border">
                    <form action="/api/auth/signout" method="POST">
                        <button className="flex items-center gap-3 text-sm font-bold text-orange-500 hover:text-orange-600 w-full py-2 px-4 rounded-lg hover:bg-orange-50 transition-all duration-300">
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 lg:pl-[260px] pb-24 lg:pb-0 font-display">
                {/* Navbar */}
                <header className="h-[70px] px-6 lg:px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border/50">
                    <div className="flex items-center gap-4 lg:hidden">
                        <Image src="/assets/logo.png" alt="Logo" width={300} height={16} className="w-1/3 h-full" />
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 p-1.5 lg:pr-4 rounded-full bg-white border border-border shadow-sm hover:border-primary/20 transition-all duration-300">
                            <div className="h-8 w-8 rounded-full bg-muted border border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-muted-foreground">
                                {profile.avatar_url ? (
                                    <Image src={profile.avatar_url} alt={profile.name} width={32} height={32} className="object-cover" />
                                ) : (
                                    profile.name.charAt(0)
                                )}
                            </div>
                            <span className="hidden sm:inline font-bold text-sm text-foreground">{profile.name}</span>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
                    {children}
                </main>
            </div>

            {/* Bottom Nav Mobile/Tablet */}
            <MobileNav items={navigation} />
        </div>
    );
}
