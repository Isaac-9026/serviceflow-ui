"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Users, HardHat } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Orden, Usuario } from "@/types/backend";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";

export default function OrdenesPage() {
  const { user } = useAuthStore();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Asignar Técnico
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null);
  const [selectedTecnico, setSelectedTecnico] = useState("");
  
  // Completar Orden
  const [isCompletarOpen, setIsCompletarOpen] = useState(false);
  const [evidencias, setEvidencias] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<Orden[]>("/ordenes");
      setOrdenes(res.data);

      if (user?.rol === "ADMIN" || user?.rol === "COORDINADOR") {
        const tRes = await api.get<Usuario[]>("/usuarios");
        setTecnicos(tRes.data.filter(u => u.rol === "TECNICO" && u.activo));
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/ordenes/${selectedOrdenId}/asignar`, { tecnicoId: Number(selectedTecnico) });
      toast.success("Técnico asignado a la orden");
      setIsAsignarOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al asignar técnico");
    }
  };

  const handleCompletar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (evidencias) {
        await api.post(`/ordenes/${selectedOrdenId}/evidencias`, { evidencia: evidencias });
      }
      await api.patch(`/ordenes/${selectedOrdenId}/completar`, { notasTecnicas: evidencias });
      toast.success("Orden completada con éxito");
      setIsCompletarOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al completar la orden");
    }
  };

  const getBadgeVariant = (estado: string) => {
    switch(estado) {
      case 'ASIGNADA': return "default";
      case 'EN_PROGRESO': return "secondary";
      case 'COMPLETADA': return "outline";
      case 'CANCELADA': return "destructive";
      default: return "default";
    }
  };

  // Si es técnico, solo ve sus órdenes asignadas
  const ordenesFiltradas = user?.rol === "TECNICO" 
    ? ordenes.filter(o => o.tecnicoAsignado?.id === user.id)
    : ordenes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground text-sm">
            {user?.rol === "TECNICO" ? "Revisa y completa tus asignaciones actuales." : "Asigna y monitorea el progreso del equipo."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Cotización Asoc.</TableHead>
              <TableHead>Técnico</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : ordenesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay órdenes disponibles.
                </TableCell>
              </TableRow>
            ) : (
              ordenesFiltradas.map((o) => (
                <TableRow key={o.id} className="group transition-colors">
                  <TableCell className="font-medium text-muted-foreground">#{o.id}</TableCell>
                  <TableCell className="text-muted-foreground">Cot. #{o.cotizacionId}</TableCell>
                  <TableCell>
                    {o.tecnicoAsignado ? (
                      <div className="flex items-center gap-2">
                        <HardHat className="h-4 w-4 text-primary" />
                        <span>{o.tecnicoAsignado.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(o.estado)}>
                      {o.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* ACCIONES DE ADMIN */}
                      {(user?.rol === "ADMIN" || user?.rol === "COORDINADOR") && o.estado !== 'COMPLETADA' && o.estado !== 'CANCELADA' && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => { setSelectedOrdenId(o.id); setIsAsignarOpen(true); }}
                        >
                          <Users className="h-4 w-4" /> Asignar
                        </Button>
                      )}
                      
                      {/* ACCIONES DE TÉCNICO */}
                      {user?.rol === "TECNICO" && o.estado !== 'COMPLETADA' && o.estado !== 'CANCELADA' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => { setSelectedOrdenId(o.id); setIsCompletarOpen(true); setEvidencias(""); }}
                        >
                          <CheckCircle className="h-4 w-4" /> Finalizar
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

      {/* Dialog: Asignar Técnico */}
      <Dialog open={isAsignarOpen} onOpenChange={setIsAsignarOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Técnico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAsignar} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="tecnico">Técnico Disponible</Label>
              <Select value={selectedTecnico} onValueChange={setSelectedTecnico}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un técnico" />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!selectedTecnico}>
                Confirmar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Completar Orden (Técnico) */}
      <Dialog open={isCompletarOpen} onOpenChange={setIsCompletarOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalizar Trabajo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompletar} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="evidencias">Notas y Evidencias URL</Label>
              <Input 
                id="evidencias" 
                placeholder="https://bucket... o detalles técnicos"
                value={evidencias}
                onChange={e => setEvidencias(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!evidencias}>
                Marcar como Completada
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
