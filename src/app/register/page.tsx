"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al registrarse");
        setLoading(false);
        return;
      }

      // Auto-login after register
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push("/login");
      } else {
        router.push("/reservar");
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--club-surface)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crear Cuenta</CardTitle>
          <CardDescription>Regístrate para reservar pistas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <p className="text-sm text-[var(--club-danger)] bg-[var(--club-danger-bg)] px-3 py-2 rounded-[var(--club-radius)]">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>
          <p className="text-sm text-center text-[var(--club-ink-muted)] mt-4">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[var(--club-primary)] hover:underline">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
