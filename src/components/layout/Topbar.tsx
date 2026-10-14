"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function Topbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Workspace
        </h2>
        <Badge variant="outline" className="capitalize text-xs font-normal">
          {user.rol.toLowerCase()}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user.nombre ? user.nombre.substring(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-tight">
              {user.nombre}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {user.email}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
          title="Cerrar sesión"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
