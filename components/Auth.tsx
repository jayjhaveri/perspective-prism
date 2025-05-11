"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function Auth() {
    const [tab, setTab] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmationSent, setConfirmationSent] = useState(false);

    const handleSignIn = async () => {
        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                setError(error.message);
            }

        } catch (err: any) {
            console.error("Login error:", err.message);
            setError("Login failed. Please try again.");
        }

        setLoading(false);
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError("");

        if (!name.trim()) {
            setError("Name is required for signup.");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            const userId = data.user?.id;

            if (userId) {
                console.log("New user signed up with ID:", userId);

                const { error: insertError } = await supabase.from('users').insert([
                    {
                        user_id: userId,
                        email: email,
                        name: name.trim(),
                    },
                ]);

                if (insertError) {
                    console.error('Error inserting user:', insertError.message);
                    setError('Error inserting user data.');
                } else {
                    console.log('User successfully inserted.');
                    setConfirmationSent(true);
                }
            }

        } catch (err: any) {
            console.error("Signup error:", err.message);
            setError("Signup failed. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
                <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">Perspective Prism</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {confirmationSent ? (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                        Confirmation email sent. Please check your inbox.
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-4">
                            <button
                                className={`px-4 py-2 ${tab === 'signin' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                                onClick={() => setTab('signin')}
                            >
                                Sign In
                            </button>
                            <button
                                className={`px-4 py-2 ${tab === 'signup' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
                                onClick={() => setTab('signup')}
                            >
                                Sign Up
                            </button>
                        </div>

                        {tab === 'signin' ? (
                            <>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    className="mb-3 w-full p-3 border border-gray-300 rounded-lg"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="mb-4 w-full p-3 border border-gray-300 rounded-lg"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <Button
                                    onClick={handleSignIn}
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg"
                                >
                                    {loading ? "Signing In..." : "Sign In"}
                                </Button>
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="mb-3 w-full p-3 border border-gray-300 rounded-lg"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />

                                <input
                                    type="email"
                                    placeholder="Email"
                                    className="mb-3 w-full p-3 border border-gray-300 rounded-lg"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="mb-4 w-full p-3 border border-gray-300 rounded-lg"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <Button
                                    onClick={handleSignUp}
                                    disabled={loading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                                >
                                    {loading ? "Signing Up..." : "Sign Up"}
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}