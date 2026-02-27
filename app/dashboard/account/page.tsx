import { getProfile } from '@/lib/supabase/get-profile';
import AccountForm from './account-form';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
    const profile = await getProfile();
    if (!profile) redirect('/login');

    return <AccountForm profile={profile} />;
}
