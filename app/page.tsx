"use client";

import { useAuth } from "@/app/context/AuthContext";
import PerspectivePrism from "@/components/PerspectivePrism";
import Auth from "@/components/Auth";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <PerspectivePrism user={user} /> : <Auth />;
}