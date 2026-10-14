"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Eye, Search, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Cliente } from "@/types/backend";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit & Create Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: 0, nombre: "", email: "", telefono: "", direccion: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detalle de Cliente
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const fetchClientes = async () => {
    try {
      const res = await api.get<Cliente[]>("/clientes");
      setClientes(res.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error("Error al cargar los clientes");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return clientes;
    const q = searchQuery.toLowerCase();
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.telefono && c.telefono.toLowerCase().includes(q)) ||
      (c.direccion && c.direccion.toLowerCase().includes(q))
    );
  }, [clientes, searchQuery]);

  const openCreateDialog = () => {
    setIsEditing(false);
    setFormData({ id: 0, nombre: "", email: "", telefono: "", direccion: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (cliente: Cliente) => {
    setIsEditing(true);
    setFormData(cliente);
    setIsDialogOpen(true);
  };

  const openDetalleDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDetalleOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/clientes/${formData.id}`, formData);
        toast.success("Cliente actualizado exitosamente");
      } else {
        await api.post("/clientes", formData);
        toast.success("Cliente creado exitosamente");
      }
      setIsDialogOpen(false);
      fetchClientes();
    } catch (error) {
      toast.error(isEditing ? "Error al actualizar cliente" : "Error al crear cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directorio de Clientes</h1>
          <p className="text-muted-foreground text-sm">
            Administra las empresas y contactos a los que prestas servicio.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono..."
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

      {/* Tabla de Clientes */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nombre / Empresa</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredClientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {searchQuery 
                    ? `No se encontraron clientes que coincidan con "${searchQuery}".` 
                    : "No hay clientes registrados en la base de datos."}
                </TableCell>
              </TableRow>
            ) : (
              filteredClientes.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{c.id}</TableCell>
                  <TableCell className="font-semibold text-foreground">{c.nombre}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.telefono || "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={c.direccion}>
                    {c.direccion || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => openDetalleDialog(c)}
                        title="Ver Ficha de Cliente"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ficha
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 gap-1 text-xs"
                        onClick={() => openEditDialog(c)}
                        title="Editar Datos"
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" /> Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOG: CREAR / EDITAR CLIENTE */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Cliente" : "Añadir Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Actualiza los datos de contacto o dirección del cliente." 
                : "Registra los datos para asociar solicitudes de servicio."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Razón Social / Nombre Completo *</Label>
              <Input 
                id="nombre" 
                value={formData.nombre} 
                onChange={e => setFormData({...formData, nombre: e.target.value})} 
                placeholder="Ej. Acme Corp o Juan Pérez"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="contacto@ejemplo.com"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
              <Input 
                id="telefono" 
                value={formData.telefono} 
                onChange={e => setFormData({...formData, telefono: e.target.value})} 
                placeholder="+51 987 654 321"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección Fiscal / Operativa</Label>
              <Input 
                id="direccion" 
                value={formData.direccion} 
                onChange={e => setFormData({...formData, direccion: e.target.value})} 
                placeholder="Av. Principal 123, Of. 401"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.nombre || !formData.email}>
                {isSubmitting ? "Guardando..." : (isEditing ? "Actualizar Cliente" : "Guardar Cliente")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: FICHA DE CLIENTE */}
      <Dialog open={isDetalleOpen} onOpenChange={setIsDetalleOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Ficha de Cliente
            </DialogTitle>
            <DialogDescription>
              Información de contacto registrada en el sistema.
            </DialogDescription>
          </DialogHeader>
          {selectedCliente && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Razón Social</span>
                  <p className="text-base font-bold text-foreground">{selectedCliente.nombre}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm pt-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{selectedCliente.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{selectedCliente.telefono || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{selectedCliente.direccion || "No registrada"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsDetalleOpen(false);
                    openEditDialog(selectedCliente);
                  }}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar Datos
                </Button>
                <Button variant="default" size="sm" onClick={() => setIsDetalleOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
