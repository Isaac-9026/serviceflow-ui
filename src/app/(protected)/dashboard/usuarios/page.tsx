"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Power, PowerOff, Search, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Usuario, Rol } from "@/types/backend";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rolFilter, setRolFilter] = useState<string>("TODOS");

  // Create User State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "TECNICO" as Rol,
  });

  // Edit User State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    nombre: "",
    apellido: "",
    email: "",
    rol: "TECNICO" as Rol,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsuarios = async () => {
    try {
      const res = await api.get<Usuario[]>("/usuarios");
      setUsuarios(res.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error("Error al cargar los usuarios del sistema");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.apellido && u.apellido.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRol = rolFilter === "TODOS" || u.rol === rolFilter;
      return matchesSearch && matchesRol;
    });
  }, [usuarios, searchQuery, rolFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/usuarios", {
        nombre: createForm.nombre,
        apellido: createForm.apellido || "",
        email: createForm.email,
        password: createForm.password,
        rol: createForm.rol,
      });
      toast.success("Usuario registrado exitosamente");
      setIsCreateOpen(false);
      setCreateForm({ nombre: "", apellido: "", email: "", password: "", rol: "TECNICO" });
      fetchUsuarios();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al crear usuario";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (u: Usuario) => {
    setEditForm({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido || "",
      email: u.email,
      rol: u.rol,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/usuarios/${editForm.id}`, {
        nombre: editForm.nombre,
        apellido: editForm.apellido || "",
        email: editForm.email,
        rol: editForm.rol,
      });
      toast.success("Usuario actualizado correctamente");
      setIsEditOpen(false);
      fetchUsuarios();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al actualizar usuario";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEstado = async (id: number, currentEstado: boolean) => {
    const nuevoEstado = !currentEstado;
    try {
      await api.patch(`/usuarios/${id}/estado?activo=${nuevoEstado}`);
      toast.success(nuevoEstado ? "Usuario habilitado" : "Usuario deshabilitado");
      fetchUsuarios();
    } catch (error) {
      toast.error("Error al actualizar estado del usuario");
    }
  };

  const getRolBadgeVariant = (rol: Rol) => {
    switch (rol) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
      case "COORDINADOR":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "TECNICO":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground text-sm">
            Control de cuentas de acceso, roles operativos y habilitación de personal.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <Select value={rolFilter} onValueChange={(val) => setRolFilter(val || "TODOS")}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los roles</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="COORDINADOR">Coordinador</SelectItem>
              <SelectItem value="TECNICO">Técnico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchQuery || rolFilter !== "TODOS") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setRolFilter("TODOS");
            }}
            className="h-9"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Correo Electrónico</TableHead>
              <TableHead>Rol Operativo</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="text-right w-[160px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Users className="h-6 w-6 text-muted-foreground/60" />
                    <p>No se encontraron usuarios para el criterio seleccionado.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsuarios.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{u.id}</TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {u.nombre} {u.apellido || ""}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRolBadgeVariant(u.rol)}>
                      {u.rol}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.activo ? "outline" : "secondary"}
                      className={
                        u.activo
                          ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 gap-1 text-xs"
                        onClick={() => openEditDialog(u)}
                        title="Editar datos de usuario"
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 gap-1 text-xs ${
                          u.activo
                            ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                            : "text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950/30"
                        }`}
                        onClick={() => toggleEstado(u.id, u.activo)}
                        title={u.activo ? "Desactivar acceso" : "Reactivar acceso"}
                      >
                        {u.activo ? (
                          <>
                            <PowerOff className="h-3.5 w-3.5" /> Desactivar
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5" /> Activar
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOG: CREAR USUARIO */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea una cuenta de acceso con credenciales para el personal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="create-nombre">Nombre *</Label>
                <Input
                  id="create-nombre"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  placeholder="Ej. Carlos"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-apellido">Apellido</Label>
                <Input
                  id="create-apellido"
                  value={createForm.apellido}
                  onChange={(e) => setCreateForm({ ...createForm, apellido: e.target.value })}
                  placeholder="Ej. Mendoza"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Correo Electrónico (Login) *</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="carlos@serviceflow.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-pass">Contraseña Inicial *</Label>
              <Input
                id="create-pass"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-rol">Rol Operativo *</Label>
              <Select
                value={createForm.rol}
                onValueChange={(val) => setCreateForm({ ...createForm, rol: val as Rol })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador (Control Total)</SelectItem>
                  <SelectItem value="COORDINADOR">Coordinador (Gestión Operativa)</SelectItem>
                  <SelectItem value="TECNICO">Técnico (Ejecución de Campo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !createForm.nombre || !createForm.email || !createForm.password}>
                {isSubmitting ? "Guardando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: EDITAR USUARIO */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información personal y permisos de rol.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apellido">Apellido</Label>
                <Input
                  id="edit-apellido"
                  value={editForm.apellido}
                  onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo Electrónico *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rol">Rol Operativo *</Label>
              <Select
                value={editForm.rol}
                onValueChange={(val) => setEditForm({ ...editForm, rol: val as Rol })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="COORDINADOR">Coordinador</SelectItem>
                  <SelectItem value="TECNICO">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !editForm.nombre || !editForm.email}>
                {isSubmitting ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
