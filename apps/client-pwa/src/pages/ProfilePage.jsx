import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Save, Loader2, LogOut } from 'lucide-react';

export default function ProfilePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/auth');
                return;
            }

            setUser(user);

            // Get data from metadata
            // Note: In a real heavy app we might use a separate 'profiles' table, 
            // but for simplicity/speed we can use auth.user_metadata
            const meta = user.user_metadata || {};
            setUsername(meta.username || meta.full_name || user.email?.split('@')[0]);
            setAvatarUrl(meta.avatar_url);

        } catch (error) {
            console.error('Error loading user:', error.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setLoading(true);
            const updates = {
                username: username,
                updated_at: new Date(),
            };

            const { error } = await supabase.auth.updateUser({
                data: updates,
            });

            if (error) throw error;
            alert('Profil mis à jour !');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function uploadAvatar(event) {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Vous devez sélectionner une image.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Check if bucket exists, if not... well Supabase usually needs it created in dashboard
            // We assume 'avatars' bucket exists and is public
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Update user metadata immediately
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl },
            });

        } catch (error) {
            console.error(error);
            alert('Erreur upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    if (loading && !user) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-background text-white p-6 pb-32">
            <h1 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Mon <span className="text-accent-pink">Profil</span></h1>

            <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-zinc-600" />
                        )}
                    </div>

                    <label className="absolute bottom-0 right-0 bg-accent-pink text-white p-2 rounded-full cursor-pointer shadow-lg active:scale-95 transition-transform">
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
                <p className="mt-4 text-zinc-500 text-sm font-medium">{user?.email}</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nom d'utilisateur</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-accent-pink/50 transition-all"
                    />
                </div>

                <button
                    onClick={updateProfile}
                    disabled={loading}
                    className="w-full bg-white text-black font-black h-12 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Enregistrer les modifications
                </button>

                <div className="h-px bg-zinc-900 my-8" />

                {/* Admin Tools for Coach Charly */}
                <div className="space-y-4">
                    <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest px-1">Outils Coach</h2>
                    <button
                        onClick={() => navigate('/admin/editor')}
                        className="w-full bg-blue-600/10 text-blue-400 font-bold h-12 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-blue-600/20 hover:bg-blue-600/20"
                    >
                        <Camera size={18} />
                        Éditeur de Mur (Détourage)
                    </button>
                </div>

                <div className="h-px bg-zinc-900 my-8" />

                <button
                    onClick={handleSignOut}
                    className="w-full bg-zinc-900 text-red-400 font-bold h-12 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-zinc-800 hover:bg-zinc-800"
                >
                    <LogOut size={18} />
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}
