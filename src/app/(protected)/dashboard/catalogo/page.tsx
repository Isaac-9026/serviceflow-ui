"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Power, PowerOff, Search, Layers } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Categoria } from "@/types/backend";

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

export default function CatalogoPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create & Edit State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: 0, nombre: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategorias = async () => {
    try {
      // Pedimos todas (sin filtrar solo activas) para poder administrarlas
      const res = await api.get<Categoria[]>("/categorias");
      setCategorias(res.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error("Error al cargar las categorías del catálogo");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const filteredCategorias = useMemo(() => {
    if (!searchQuery.trim()) return categorias;
    const q = searchQuery.toLowerCase();
    return categorias.filter(c => c.nombre.toLowerCase().includes(q));
  }, [categorias, searchQuery]);

  const openCreateDialog = () => {
    setIsEditing(false);
    setFormData({ id: 0, nombre: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (categoria: Categoria) => {
    setIsEditing(true);
    setFormData({ id: categoria.id, nombre: categoria.nombre });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/categorias/${formData.id}`, { nombre: formData.nombre.trim() });
        toast.success("Categoría actualizada con éxito");
      } else {
        await api.post("/categorias", { nombre: formData.nombre.trim() });
        toast.success("Categoría de servicio creada con éxito");
      }
      setIsDialogOpen(false);
      fetchCategorias();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al procesar la categoría";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEstado = async (categoria: Categoria) => {
    const nuevoEstado = !categoria.activo;
    try {
      await api.patch(`/categorias/${categoria.id}/estado`, { activo: nuevoEstado });
      toast.success(nuevoEstado ? "Categoría habilitada" : "Categoría deshabilitada");
      fetchCategorias();
    } catch (error) {
      toast.error("No se pudo cambiar el estado de la categoría");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de Servicios</h1>
          <p className="text-muted-foreground text-sm">
            Especialidades y tipos de servicio ofrecidos por la empresa técnica.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Categoría
        </Button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="h-9">
            Limpiar
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Categoría / Servicio</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="text-right w-[160px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCategorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="h-6 w-6 text-muted-foreground/60" />
                    <p>
                      {searchQuery
                        ? `No hay categorías que coincidan con "${searchQuery}".`
                        : "El catálogo está vacío. Haz clic en 'Nueva Categoría' para empezar."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategorias.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{c.id}</TableCell>
                  <TableCell className="font-semibold text-foreground">{c.nombre}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={c.activo ? "outline" : "secondary"}
                      className={c.activo 
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" 
                        : "bg-muted text-muted-foreground"}
                    >
                      {c.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 gap-1 text-xs"
                        onClick={() => openEditDialog(c)}
                        title="Renombrar Categoría"
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" /> Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-8 px-2 gap-1 text-xs ${c.activo ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950/30"}`}
                        onClick={() => handleToggleEstado(c)}
                        title={c.activo ? "Deshabilitar del catálogo" : "Habilitar en el catálogo"}
                      >
                        {c.activo ? (
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

      {/* DIALOG: CREAR / EDITAR CATEGORIA */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Categoría" : "Nueva Categoría de Servicio"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Modifica el nombre oficial de este rubro de servicios."
                : "Agrega una nueva especialidad para clasificar solicitudes y órdenes."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cat-nombre">Nombre de la Categoría *</Label>
              <Input 
                id="cat-nombre" 
                placeholder="Ej. Plomería, Mantenimiento Eléctrico, Climatización..."
                value={formData.nombre} 
                onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                required 
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.nombre.trim()}>
                {isSubmitting ? "Guardando..." : (isEditing ? "Actualizar" : "Guardar")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
