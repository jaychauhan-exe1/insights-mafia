'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { authenticate } from './actions';
import { Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append('remember', rememberMe.toString());
        const res = await authenticate(formData);

        if (res?.error) {
            toast.error(res.error);
            setLoading(false);
        } else {
            toast.success('Logged in successfully!');
            router.push('/dashboard');
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-[#F3F4F6] p-6">
            <div className="flex flex-col items-center mb-8">
                <div className="relative shadow-sm rounded-xl overflow-hidden bg-white flex items-center justify-center p-2">
                    <Image
                        src="/assets/logo.png"
                        width={200}
                        height={50}
                        alt="Logo"
                        className="object-contain p-2"
                        priority
                    />
                </div>
            </div>

            <Card className="w-full max-w-[400px] border border-gray-100 shadow-sm rounded-lg bg-white overflow-hidden">
                <CardContent className="p-8">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="text-gray-400 text-sm mt-1 font-medium">Please enter your details to sign in</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="h-11 bg-white border-gray-200 rounded-xl px-4 text-gray-900 placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                                <button type="button" className="text-primary text-[11px] font-bold hover:underline">
                                    Forgot?
                                </button>
                            </div>
                            <div className="relative group/pass">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    className="h-11 bg-white border-gray-200 rounded-xl px-4 text-gray-900 placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-primary/20 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-1 pb-2">
                            <Checkbox
                                className='bg-gray-200'
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <label
                                htmlFor="remember"
                                className="text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                            >
                                Remember me
                            </label>
                        </div>

                        <Button
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold active:scale-[0.98] mt-2 transition-none"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-12">
                <p className="text-gray-400 text-xs font-medium tracking-wide">
                    Powered by Insights Mafia
                </p>
            </div>
        </div>
    );
}
