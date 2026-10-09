"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Cotizacion } from "@/types/backend";

import { Button } from "@/components/ui/button";
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

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<Cotizacion[]>("/cotizaciones");
      setCotizaciones(res.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAprobar = async (solicitudId: number, cotizacionId: number) => {
    try {
      await api.patch(`/solicitudes/${solicitudId}/cotizaciones/${cotizacionId}/aprobar`);
      toast.success("Cotización aprobada exitosamente");
      fetchData();
    } catch (error) {
      toast.error("Error al aprobar la cotización");
    }
  };

  const getBadgeVariant = (estado: string) => {
    switch(estado) {
      case 'PENDIENTE': return "default";
      case 'APROBADA': return "outline";
      case 'RECHAZADA': return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cotizaciones Generadas</h1>
          <p className="text-muted-foreground text-sm">
            Revisa y aprueba los presupuestos de las solicitudes de servicio.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Solicitud Asoc.</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Válido Hasta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : cotizaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay cotizaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              cotizaciones.map((c) => (
                <TableRow key={c.id} className="group transition-colors">
                  <TableCell className="font-medium text-muted-foreground">#{c.id}</TableCell>
                  <TableCell className="text-muted-foreground">Sol. #{c.solicitudId}</TableCell>
                  <TableCell className="font-medium">{c.descripcion}</TableCell>
                  <TableCell className="font-bold">${c.monto}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(c.validoHasta).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(c.estado)}>
                      {c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" title="Ver detalles">
                        <FileText className="h-4 w-4" />
                      </Button>
                      {c.estado === 'PENDIENTE' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20"
                          onClick={() => handleAprobar(c.solicitudId, c.id)}
                          title="Aprobar Cotización"
                        >
                          <CheckCircle className="h-4 w-4" />
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
    </div>
  );
}
