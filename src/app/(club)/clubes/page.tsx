"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Club {
  id: string;
  slug: string;
  name: string;
  city: string;
  courtCount: number;
}

export default function ClubesPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);

    setLoading(true);
    fetch(`/api/clubs?${params}`)
      .then((response) => response.json())
      .then((data) => {
        setClubs(data.clubs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [city]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Clubs de Pádel en Colombia</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Filtrar por ciudad..."
          aria-label="Filtrar por ciudad"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="w-full max-w-md px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {loading ? (
        <p className="text-zinc-500">Cargando clubs...</p>
      ) : clubs.length === 0 ? (
        <p className="text-zinc-500">No se encontraron clubs{city ? ` en "${city}"` : ""}.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Link
              key={club.id}
              href={`/reservar?clubId=${club.id}`}
              className="block bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md hover:border-teal-400 transition"
            >
              <h2 className="text-lg font-semibold text-zinc-900">{club.name}</h2>
              <p className="text-sm text-zinc-500 mt-1">{club.city}</p>
              <p className="text-sm text-teal-600 mt-2 font-medium">
                {club.courtCount} pista{club.courtCount !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
