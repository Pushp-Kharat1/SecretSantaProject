import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Gift, Home, Snowflake, Loader2, Sparkles, Calendar, MapPin, DollarSign } from 'lucide-react';
import axios from 'axios';

export const RevealPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [myWishlist, setMyWishlist] = useState('');
    const [isSavingWishlist, setIsSavingWishlist] = useState(false);

    useEffect(() => {
        const fetchMatch = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setError('Invalid link');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`/api/reveal/${token}`);
                setData(response.data);
                setMyWishlist(response.data.my_wishlist || '');
            } catch (err) {
                console.error("Failed to fetch match", err);
                setError('Failed to load your secret mission. The link might be expired or invalid.');
            } finally {
                setLoading(false);
            }
        };

        fetchMatch();
    }, [searchParams]);

    const handleSaveWishlist = async () => {
        const token = searchParams.get('token');
        if (!token) return;

        setIsSavingWishlist(true);
        try {
            await axios.post('/api/wishlist', {
                token,
                wishlist: myWishlist
            });
            alert("Wishlist updated! Your Secret Santa will see this.");
        } catch (err) {
            alert("Failed to save wishlist.");
        } finally {
            setIsSavingWishlist(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-red-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Link 🎅</h1>
                    <p className="text-gray-600 mb-6">{error || 'Something seems wrong with this secret santa link.'}</p>
                    <Link to="/" className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">
                        <Home className="w-4 h-4 mr-2" /> Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-candy-cane flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-red-100 p-4 rounded-full">
                            <Gift className="w-12 h-12 text-red-600 animate-bounce" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2 font-pixel tracking-tighter">SECRET SANTA</h1>
                    <p className="text-gray-600 font-medium">Hello, <span className="font-bold text-red-600">{data.giver}</span>!</p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-red-100 transform transition-all hover:scale-[1.01] duration-500">
                    <div className="bg-red-600 p-6 text-center">
                        <h2 className="text-white font-bold text-xl flex items-center justify-center gap-2">
                            <Snowflake className="w-5 h-5 animate-spin-slow" />
                            Your Secret Mission
                            <Snowflake className="w-5 h-5 animate-spin-slow" />
                        </h2>
                    </div>

                    <div className="p-8 pb-10 text-center">
                        {!isRevealed ? (
                            <div className="space-y-6">
                                <p className="text-gray-600">You have been assigned a person to gift!</p>
                                <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 mx-4">
                                    <span className="text-4xl">❓</span>
                                </div>

                                {(data.date || data.budget) && (
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                        {data.date && <div>📅 {data.date}</div>}
                                        {data.budget && <div>💰 {data.budget}</div>}
                                        {data.location && <div className="col-span-2">📍 {data.location}</div>}
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsRevealed(true)}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1 transition-all"
                                >
                                    Reveal My Match 🎁
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in zoom-in duration-500 space-y-6">
                                <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">You are the Secret Santa for</p>
                                <div className="py-6 relative">
                                    <div className="absolute inset-0 bg-yellow-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                                    <h3 className="relative text-5xl font-black text-gray-900 tracking-tight transform rotate-2">{data.receiver}</h3>
                                </div>
                                {data.my_wishlist && <div className="mt-4 text-left bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <h4 className="text-purple-800 font-bold mb-1 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Your Wishlist:
                                    </h4>
                                    <p className="text-purple-600">{data.my_wishlist}</p>
                                </div>}

                                {data.receiver_wishlist && (
                                    <div className="mt-6 bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-left">
                                        <h4 className="text-yellow-800 font-bold mb-2 flex items-center gap-2 uppercase text-xs tracking-wider">
                                            <Sparkles className="w-4 h-4" /> Their Wishlist
                                        </h4>
                                        <p className="text-gray-800 font-medium">"{data.receiver_wishlist}"</p>
                                    </div>
                                )}

                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h4 className="text-gray-900 font-bold mb-2 flex items-center justify-center gap-2">
                                        <Gift className="w-4 h-4 text-purple-600" />
                                        Update Your Wishlist
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-4">Let your Santa know what you like!</p>
                                    <textarea
                                        value={myWishlist}
                                        onChange={(e) => setMyWishlist(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="I like coffee, sci-fi books, and blue socks..."
                                        rows={3}
                                    />
                                    <button
                                        onClick={handleSaveWishlist}
                                        disabled={isSavingWishlist}
                                        className="mt-2 w-full py-2 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isSavingWishlist ? 'Saving...' : 'Save Wishlist'}
                                    </button>
                                </div>

                                {data.message && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900 text-sm italic">
                                        "{data.message}"
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">Organized with ❤️ using Secret Santa Organizer</p>
                </div>
            </div>
        </div>
    );
};
