"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length === 0) return;

    const result = await signIn("credentials", {
      username,
      redirect: false,
    });

    console.log("Résultat signIn:", result);

    if (result?.ok) {
      router.push("/jouer");
    } else {
      console.error("Échec de connexion:", result?.error);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f1a16] flex flex-col items-center pt-24">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center w-full"
      >
        <button
          type="submit"
          className="bg-emerald-600 text-emerald-950 font-extrabold text-3xl px-16 py-6 rounded-3xl mb-16"
        >
          JOUER
        </button>

        <div className="flex flex-col gap-2 w-full max-w-md px-6">
          <label className="text-emerald-400 font-bold uppercase text-sm">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-transparent border-2 border-emerald-500 rounded-xl px-4 py-3 text-white outline-none"
            required
          />
        </div>
      </form>
    </main>
  );
}
