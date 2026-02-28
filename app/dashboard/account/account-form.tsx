'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateAccount } from './actions';
import Image from 'next/image';
import { LogOut } from 'lucide-react';

const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=d',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    'https://api.dicebear.com/9.x/avataaars/svg?seed=Eden',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Vivian',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luis',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Nolan',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Amaya',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dd',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dddd',
];

export default function AccountPage({ profile }: { profile: any }) {
    const [loading, setLoading] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url || AVATARS[0]);

    if (!profile) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append('avatar_url', selectedAvatar);

        const res = await updateAccount(formData);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success('Account updated successfully!');
        }
        setLoading(false);
    }

    return (
        <div className="mx-auto space-y-6 pb-20 lg:pb-0">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Account Settings</h2>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Profile & Customizations</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Avatar Selection */}
                <Card className="border border-border/50 shadow-sm rounded-xl p-6 bg-white h-fit">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-lg bg-muted/30 border border-border shadow-md overflow-hidden flex items-center justify-center p-1.5 mb-6">
                            <Image src={selectedAvatar} alt="Current" width={88} height={88} className="object-cover" unoptimized />
                        </div>
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-6 text-center">Select Profile Image</p>
                        <div className="grid grid-cols-3 gap-2.5 w-full mb-8">
                            {AVATARS.map((url) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => setSelectedAvatar(url)}
                                    className={`aspect-square rounded-lg bg-muted/50 border transition-all p-1 hover:bg-primary/5 active:scale-95 flex items-center justify-center ${selectedAvatar === url ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent'
                                        }`}
                                >
                                    <Image src={url} alt="Avatar" width={32} height={32} unoptimized />
                                </button>
                            ))}
                        </div>

                        <div className="w-full pt-6 border-t border-border/50">
                            <form action="/api/auth/signout" method="POST">
                                <Button
                                    variant="outline"
                                    className="w-full h-10 rounded-lg border-orange-100 text-orange-500 font-bold text-[11px] uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all duration-300 flex items-center gap-2"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout Session
                                </Button>
                            </form>
                        </div>
                    </div>
                </Card>

                {/* Right: Form */}
                <div className="lg:col-span-2">
                    <Card className="border border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                        <CardContent className="p-6 md:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                                        <Input
                                            name="name"
                                            defaultValue={profile.name}
                                            required
                                            className="h-10 bg-white border-border rounded-lg px-4 text-[13px] text-foreground focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1 opacity-50">Role (Cannot Change)</label>
                                        <div className="h-10 bg-muted/30 border border-border/50 rounded-lg px-4 flex items-center text-muted-foreground/60 text-[11px] font-bold uppercase tracking-widest">
                                            {profile.role}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1 opacity-50">Email Address</label>
                                    <div className="h-10 bg-muted/30 border border-border/50 rounded-lg px-4 flex items-center text-muted-foreground/60 text-[13px] font-medium">
                                        {profile.email}
                                    </div>
                                </div>

                                <div className="border-t border-border/50 pt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">New Password (Optional)</label>
                                        <Input
                                            name="password"
                                            type="password"
                                            placeholder="Leave blank to keep current"
                                            className="h-10 bg-white border-border rounded-lg px-4 text-[13px] font-medium text-foreground focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary hover:bg-primary/90 text-white rounded-lg h-10 px-8 font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/10 transition-all duration-300"
                                    >
                                        {loading ? 'Saving Changes...' : 'Save Settings'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
