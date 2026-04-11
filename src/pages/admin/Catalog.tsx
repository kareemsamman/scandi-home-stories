import { useState, useEffect } from "react";
import { Printer, Package, Check, Eye, MousePointer, Ban } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useDbData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoWhite from "@/assets/logo-white.png";

const db = supabase as any;

const AdminCatalog = () => {
  const qc = useQueryClient();
  const { data: products = [], isLoading: pLoading } = useProducts();
  const { data: categories = [], isLoading: cLoading } = useCategories();

  // Catalog settings from app_settings
  const { data: catalogSettings } = useQuery({
    queryKey: ["app_settings", "catalog"],
    queryFn: async () => {
      const { data } = await db.from("app_settings").select("value").eq("key", "catalog").maybeSingle();
      return (data?.value as any) ?? { selectedCategories: [], clickable: true };
    },
    staleTime: 60_000,
  });

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [clickable, setClickable] = useState(true);

  // Sync from DB on load
  useEffect(() => {
    if (catalogSettings) {
      setSelectedCats(catalogSettings.selectedCategories || []);
      setClickable(catalogSettings.clickable !== false);
    }
  }, [catalogSettings]);

  const saveCatalogSettings = useMutation({
    mutationFn: async (settings: { selectedCategories: string[]; clickable: boolean }) => {
      await db.from("app_settings").upsert(
        { key: "catalog", value: settings },
        { onConflict: "key" }
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app_settings", "catalog"] }),
  });

  const toggleCategory = (catId: string) => {
    const next = selectedCats.includes(catId)
      ? selectedCats.filter(id => id !== catId)
      : [...selectedCats, catId];
    setSelectedCats(next);
    saveCatalogSettings.mutate({ selectedCategories: next, clickable });
  };

  const toggleClickable = () => {
    const next = !clickable;
    setClickable(next);
    saveCatalogSettings.mutate({ selectedCategories: selectedCats, clickable: next });
  };

  const isLoading = pLoading || cLoading;

  const allProducts = (products as any[]).filter(
    (p: any) => (p.status || "published") === "published"
  );

  // Show selected categories with their products
  const grouped = categories
    .map((cat: any) => ({
      cat,
      items: allProducts.filter((p: any) => p.category_id === cat.id),
      selected: selectedCats.includes(cat.id),
    }))
    .filter((g) => g.items.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
    );
  }

  return (
    <div className="catalog-page min-h-screen bg-white" dir="rtl">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-gray-900 flex-1">
          קטלוג מוצרים
          <span className="text-sm font-normal text-gray-400 ms-2">
            {selectedCats.length} קטגוריות נבחרו
          </span>
        </h1>

        {/* Clickable toggle */}
        <button
          onClick={toggleClickable}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            clickable
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-gray-50 border-gray-200 text-gray-500"
          }`}
        >
          {clickable ? <MousePointer className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
          {clickable ? "לחיצה למוצר: פעיל" : "לחיצה למוצר: כבוי"}
        </button>

        <Button variant="outline" size="sm" onClick={() => window.open("/he/product-catalog", "_blank")} className="gap-1.5">
          <Eye className="w-4 h-4" /> תצוגה מקדימה
        </Button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Printer className="w-4 h-4" />
          הדפסה
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-full">

        {/* Print header */}
        <div className="hidden print:flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-900">
          <div>
            <h1 className="text-2xl font-black text-gray-900">קטלוג מוצרים</h1>
            <p className="text-sm text-gray-500 mt-1">A.M.G Pergola</p>
          </div>
          <img src={logoWhite} alt="AMG Pergola" className="h-12 object-contain invert" />
        </div>

        {grouped.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">אין קטגוריות עם מוצרים</p>
          </div>
        )}

        {grouped.map(({ cat, items, selected }) => (
          <div
            key={cat.id}
            className={`mb-8 print:mb-6 catalog-section rounded-xl border-2 p-5 transition-colors ${
              selected
                ? "border-green-200 bg-green-50/30 print:border-gray-200 print:bg-white"
                : "border-gray-100 bg-gray-50/20 opacity-50 print:hidden"
            }`}
          >
            {/* Category header with toggle */}
            <div className="flex items-center gap-4 mb-4 print:mb-3 pb-3 border-b border-gray-200">
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`print:hidden w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  selected
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {selected && <Check className="w-4 h-4 text-white" />}
              </button>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{cat.name_he}</h2>
                {cat.name_ar && cat.name_ar !== cat.name_he && (
                  <p className="text-base text-gray-500 mt-0.5">{cat.name_ar}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 print:hidden">{items.length} מוצרים</span>
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2 print:gap-3">
              {items.map((product: any) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 rounded-lg border border-gray-100 bg-white print:p-2 print:border-gray-200"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-200 shrink-0 print:w-16 print:h-16"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 print:w-16 print:h-16">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{product.name}</h3>
                    {product.name_ar && product.name_ar !== product.name && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{product.name_ar}</p>
                    )}
                    {product.sku && (
                      <p className="text-[10px] text-gray-400 font-mono mt-1">{product.sku}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:flex { display: flex !important; }
          .catalog-page { min-height: auto !important; }
          .catalog-section { break-inside: avoid; }
          @page { margin: 10mm; size: A4; }
          img { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default AdminCatalog;
