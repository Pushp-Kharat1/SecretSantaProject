import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import axios from 'axios';

export const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
            const response = await axios.post(endpoint, { email, password });

            // On success, store user data and redirect
            localStorage.setItem('user', JSON.stringify(response.data.user));
            // Store the password in session storage to use as the "admin password" for the current session
            // As per requirements: "password used during login, that will be the admin password"
            sessionStorage.setItem('adminPassword', password);

            navigate('/app');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-candy-cane flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-2 font-pixel tracking-tighter flex items-center justify-center gap-3">
                        <Sparkles className="text-yellow-500 animate-spin-slow" />
                        SECRET SANTA
                    </h1>
                    <p className="text-gray-600 font-medium">Organizer Portal</p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-50 p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        {isLogin ? 'Welcome Back!' : 'Create Account'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                    placeholder="santa@northpole.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            {!isLogin && <p className="text-xs text-gray-400 mt-1">This will be your admin password.</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? 'Processing...' : (
                                <>
                                    {isLogin ? 'Login' : 'Sign Up'} <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-red-600 font-bold hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Login'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
