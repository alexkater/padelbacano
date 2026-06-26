"use client";
import { CLUB_CONFIG } from "@/padelbacano.config";

import { useState, Suspense, type SyntheticEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function getPostLoginPath(callbackUrl: string | null) {
  if (callbackUrl) return callbackUrl;

  try {
    const response = await fetch("/api/user/profile", { cache: "no-store" });

    if (!response.ok) return "/clubes";

    const data = await response.json();
    const isAdmin = data?.profile?.role === "admin" || data?.session?.role === "club_admin";
    return isAdmin ? "/admin" : "/clubes";
  } catch {
    return "/clubes";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Email o contraseña incorrectos");
    } else {
      const path = await getPostLoginPath(callbackUrl);
      router.replace(path);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--club-surface)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{CLUB_CONFIG.shortName}</CardTitle>
          <CardDescription>Accede a tu cuenta para reservar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-[var(--club-danger)] bg-[var(--club-danger-bg)] px-3 py-2 rounded-[var(--club-radius)]">{error}</p>}
            <Button type="submit" className="w-full">Iniciar Sesión</Button>
          </form>
          <p className="text-sm text-center text-[var(--club-ink-muted)] mt-4">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-[var(--club-primary)] hover:underline">Crear cuenta</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--club-surface)] px-4">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--club-border)] border-t-[var(--club-primary)] rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
