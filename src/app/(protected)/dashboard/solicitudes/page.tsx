"use client";

import { useEffect, useState } from "react";
import { Plus, Ban, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Solicitud, Cliente, Categoria } from "@/types/backend";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({ clienteId: "", categoriaId: "", descripcion: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCotizarOpen, setIsCotizarOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(null);
  const [cotizacionData, setCotizacionData] = useState({ descripcion: "", monto: "", validoHasta: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [solRes, cliRes, catRes] = await Promise.all([
        api.get<Solicitud[]>("/solicitudes"),
        api.get<Cliente[]>("/clientes"),
        api.get<Categoria[]>("/categorias")
      ]);
      setSolicitudes(solRes.data);
      setClientes(cliRes.data);
      setCategorias(catRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setFormData({ clienteId: "", categoriaId: "", descripcion: "" });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/solicitudes", {
        clienteId: Number(formData.clienteId),
        categoriaId: Number(formData.categoriaId),
        descripcion: formData.descripcion
      });
      toast.success("Solicitud creada exitosamente");
      setIsDialogOpen(false);
      fetchData(); // reload solicitudes
    } catch (error) {
      toast.error("Error al crear la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      await api.patch(`/solicitudes/${id}/cancelar`);
      toast.success("Solicitud cancelada");
      fetchData();
    } catch (error) {
      toast.error("No se pudo cancelar la solicitud");
    }
  };

  const handleCotizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/solicitudes/${selectedSolicitudId}/cotizaciones`, {
        descripcion: cotizacionData.descripcion,
        monto: Number(cotizacionData.monto),
        validoHasta: cotizacionData.validoHasta
      });
      toast.success("Cotización enviada exitosamente");
      setIsCotizarOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al crear la cotización");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeVariant = (estado: string) => {
    switch(estado) {
      case 'PENDIENTE': return "default";
      case 'COTIZADA': return "secondary";
      case 'APROBADA': return "outline";
      case 'CANCELADA': 
      case 'RECHAZADA': return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Solicitudes</h1>
          <p className="text-muted-foreground text-sm">
            Recibe e inspecciona las solicitudes de los clientes.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Solicitud
          </Button>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Añadir Solicitud</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={formData.clienteId} onValueChange={(val) => setFormData({...formData, clienteId: val || ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría del Servicio</Label>
                <Select value={formData.categoriaId} onValueChange={(val) => setFormData({...formData, categoriaId: val || ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción del Problema</Label>
                <Input 
                  id="descripcion" 
                  value={formData.descripcion} 
                  onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || !formData.clienteId || !formData.categoriaId}>
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : solicitudes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay solicitudes en la bandeja.
                </TableCell>
              </TableRow>
            ) : (
              solicitudes.map((s) => (
                <TableRow key={s.id} className="group transition-colors">
                  <TableCell className="font-medium text-muted-foreground">#{s.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.creadoEn).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{s.clienteNombre}</TableCell>
                  <TableCell>{s.categoriaNombre}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(s.estado)}>
                      {s.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" title="Ver detalles">
                        <FileText className="h-4 w-4" />
                      </Button>
                      {s.estado === 'PENDIENTE' && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setSelectedSolicitudId(s.id);
                            setCotizacionData({ descripcion: "Cotización para " + s.categoriaNombre, monto: "", validoHasta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
                            setIsCotizarOpen(true);
                          }}
                        >
                          Cotizar
                        </Button>
                      )}
                      {s.estado === 'PENDIENTE' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelar(s.id)}
                          title="Cancelar solicitud"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCotizarOpen} onOpenChange={setIsCotizarOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Elaborar Cotización</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCotizar} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="cot-descripcion">Descripción del Trabajo</Label>
              <Input 
                id="cot-descripcion" 
                value={cotizacionData.descripcion} 
                onChange={e => setCotizacionData({...cotizacionData, descripcion: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monto">Monto Estimado ($)</Label>
              <Input 
                id="monto" 
                type="number"
                min="0"
                step="0.01"
                value={cotizacionData.monto} 
                onChange={e => setCotizacionData({...cotizacionData, monto: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validoHasta">Válido Hasta</Label>
              <Input 
                id="validoHasta" 
                type="date"
                value={cotizacionData.validoHasta} 
                onChange={e => setCotizacionData({...cotizacionData, validoHasta: e.target.value})} 
                required 
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting || !cotizacionData.monto}>
                {isSubmitting ? "Enviando..." : "Enviar Cotización"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
