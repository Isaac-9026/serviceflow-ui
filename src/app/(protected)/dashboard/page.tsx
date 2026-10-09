"use client";

import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido de vuelta, {user?.nombre}. Aquí tienes un resumen de la actividad.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Skeleton Widgets */}
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="h-20 w-full animate-pulse rounded bg-muted"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
