"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  Boxes,
  X,
  FileText,
  Barcode
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  clinic_id: string;
  name: string;
  sku: string | null;
  stock: number;
  purchase_price: number;
  sale_price: number;
  min_stock_alert: number;
  created_at: string;
}

export default function InventarioPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "low" | "out">("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [isSaving, setIsSaving] = useState(false);

  // Load clinic ID and inventory
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Obtener el perfil para sacar el clinic_id
        const { data: profile, error: profError } = await supabase
          .from("doctor_profiles")
          .select("clinic_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profError || !profile?.clinic_id) {
          console.error("Clinic ID not found in profile:", profError);
          return;
        }

        setClinicId(profile.clinic_id);
        await loadInventory(profile.clinic_id);
      } catch (err) {
        console.error("Error loading inventory setup:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadInventory = async (cId: string) => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("clinic_id", cId)
      .order("name", { ascending: true });

    if (error) {
      toast.error("Error al cargar inventario", { description: error.message });
    } else {
      setItems(data || []);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedItemId(null);
    setName("");
    setSku("");
    setStock(0);
    setPurchasePrice(0);
    setSalePrice(0);
    setMinStockAlert(5);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setModalMode("edit");
    setSelectedItemId(item.id);
    setName(item.name);
    setSku(item.sku || "");
    setStock(item.stock);
    setPurchasePrice(item.purchase_price);
    setSalePrice(item.sale_price);
    setMinStockAlert(item.min_stock_alert);
    setShowModal(true);
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar ${name} de tu catálogo de medicamentos?`)) return;

    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Medicamento eliminado");
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      toast.error("Error al eliminar", { description: err.message });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;

    setIsSaving(true);
    try {
      const itemData = {
        clinic_id: clinicId,
        name: name.trim(),
        sku: sku.trim() || null,
        stock: Number(stock),
        purchase_price: Number(purchasePrice),
        sale_price: Number(salePrice),
        min_stock_alert: Number(minStockAlert)
      };

      if (modalMode === "add") {
        const { data, error } = await supabase
          .from("inventory_items")
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;
        toast.success("Medicamento agregado exitosamente");
        setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (modalMode === "edit" && selectedItemId) {
        const { data, error } = await supabase
          .from("inventory_items")
          .update(itemData)
          .eq("id", selectedItemId)
          .select()
          .single();

        if (error) throw error;
        toast.success("Medicamento actualizado");
        setItems(prev => prev.map(item => item.id === selectedItemId ? data : item));
      }

      setShowModal(false);
    } catch (err: any) {
      toast.error("Error al guardar", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === "all" ? true :
      statusFilter === "low" ? (item.stock <= item.min_stock_alert && item.stock > 0) :
      statusFilter === "out" ? item.stock === 0 : true;

    return matchesSearch && matchesStatus;
  });

  // Profit margins helpers
  const profitMargin = salePrice - purchasePrice;
  const marginPercentage = salePrice > 0 ? (profitMargin / salePrice) * 100 : 0;

  // General metrics calculations
  const totalProducts = items.length;
  const lowStockCount = items.filter(item => item.stock <= item.min_stock_alert && item.stock > 0).length;
  const outOfStockCount = items.filter(item => item.stock === 0).length;
  const totalValuation = items.reduce((sum, item) => sum + (item.stock * item.purchase_price), 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-slate-500 text-sm">Cargando inventario de almacén...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Package className="h-8 w-8 text-teal-500" />
            Almacén e Inventario
          </h1>
          <p className="text-slate-400 mt-1">
            Control de medicamentos, stock actual, compras/ventas y alertas de reabastecimiento.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="rounded-xl px-5 bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)] self-start md:self-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Medicamento
        </Button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Catálogo Total</CardTitle>
            <Boxes className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{totalProducts}</div>
            <p className="text-slate-500 text-[10px] mt-1">Medicinas registradas</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{lowStockCount}</div>
            <p className="text-slate-500 text-[10px] mt-1">Requieren reabastecimiento</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Agotados</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{outOfStockCount}</div>
            <p className="text-slate-500 text-[10px] mt-1">Sin unidades disponibles</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Valor Inventario</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">${totalValuation.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
            <p className="text-slate-500 text-[10px] mt-1">Valuación a precio de compra</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Board */}
      <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-900/40 border-slate-800 text-sm focus-visible:ring-teal-500/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                className={`text-xs h-9 rounded-lg ${statusFilter === "all" ? "bg-teal-600 hover:bg-teal-550" : "border-slate-800 bg-slate-900/20 text-slate-400"}`}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "low" ? "default" : "outline"}
                onClick={() => setStatusFilter("low")}
                className={`text-xs h-9 rounded-lg flex items-center gap-1.5 ${statusFilter === "low" ? "bg-amber-600 hover:bg-amber-600/90 text-white" : "border-slate-800 bg-slate-900/20 text-slate-400"}`}
              >
                Stock Bajo
                {lowStockCount > 0 && <span className="bg-amber-500 text-[10px] text-slate-950 font-bold px-1.5 py-0.5 rounded-full">{lowStockCount}</span>}
              </Button>
              <Button
                variant={statusFilter === "out" ? "default" : "outline"}
                onClick={() => setStatusFilter("out")}
                className={`text-xs h-9 rounded-lg flex items-center gap-1.5 ${statusFilter === "out" ? "bg-red-650 hover:bg-red-650/90 text-white" : "border-slate-800 bg-slate-900/20 text-slate-400"}`}
              >
                Agotados
                {outOfStockCount > 0 && <span className="bg-red-500 text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full">{outOfStockCount}</span>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-900">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider border-b border-slate-900 font-medium">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">SKU</th>
                  <th className="py-3.5 px-4 font-semibold">Nombre del Medicamento</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Unidades</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Costo Compra</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Precio Venta</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Margen</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 bg-slate-950/10">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => {
                    const margin = item.sale_price - item.purchase_price;
                    const marginPercent = item.sale_price > 0 ? (margin / item.sale_price) * 100 : 0;

                    let stockBadge = (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[11px]">
                        {item.stock} unidades
                      </span>
                    );
                    if (item.stock === 0) {
                      stockBadge = (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-[11px]">
                          Agotado
                        </span>
                      );
                    } else if (item.stock <= item.min_stock_alert) {
                      stockBadge = (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium text-[11px]">
                          Bajo ({item.stock})
                        </span>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/30 transition-all">
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {item.sku || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-200">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {stockBadge}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-300 font-mono">
                          ${item.purchase_price.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-teal-400 font-mono font-semibold">
                          ${item.sale_price.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-emerald-400 font-medium font-mono text-[11px]">
                            {marginPercent.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenEditModal(item)}
                              className="h-8 w-8 text-slate-400 hover:text-teal-400 hover:bg-slate-900/60"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No se encontraron medicamentos en el inventario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pop-up modal Form (Add/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 shadow-2xl max-w-md w-full relative overflow-hidden max-h-[95vh] overflow-y-auto rounded-2xl">
            {/* inner glow accent */}
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />

            <CardHeader className="pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-teal-500" />
                  {modalMode === "add" ? "Agregar Medicamento" : "Editar Medicamento"}
                </CardTitle>
                <button
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 rounded-lg bg-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    Nombre y Presentación
                  </Label>
                  <Input
                    required
                    placeholder="Ej. Paracetamol 500mg (Caja c/ 20 tabletas)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs flex items-center gap-1">
                      <Barcode className="h-3.5 w-3.5 text-slate-500" />
                      SKU / Código (Opcional)
                    </Label>
                    <Input
                      placeholder="Ej. 75012345"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs flex items-center gap-1">
                      <Boxes className="h-3.5 w-3.5 text-slate-500" />
                      Unidades en Stock
                    </Label>
                    <Input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                      className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                      Costo Compra (Unitario)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0.00"
                      value={purchasePrice || ""}
                      onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                      className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                      Precio Venta (Público)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0.00"
                      value={salePrice || ""}
                      onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                      className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                    Alerta de Stock Bajo (Umbral mínimo)
                  </Label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                    className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                  />
                </div>

                {/* Profit calculator breakdown */}
                {salePrice > 0 && (
                  <div className="bg-slate-950/50 border border-slate-850 p-3.5 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Utilidad bruta por unidad:</span>
                      <span className="font-semibold text-slate-200">${profitMargin.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Margen de ganancia:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {marginPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}

                <Separator className="bg-slate-800/80 my-4" />

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="border-slate-800 bg-slate-900/20 text-slate-400 hover:bg-slate-900/40 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.3)] min-w-[100px]"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
