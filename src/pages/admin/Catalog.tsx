import { useState } from "react";
import { Printer, Package } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useDbData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logoWhite from "@/assets/logo-white.png";

const AdminCatalog = () => {
  const { data: products = [], isLoading: pLoading } = useProducts();
  const { data: categories = [], isLoading: cLoading } = useCategories();
  const [selectedCat, setSelectedCat] = useState("all");

  const isLoading = pLoading || cLoading;

  // Filter products — only published
  const allProducts = (products as any[]).filter(
    (p: any) => (p.status || "published") === "published"
  );

  // Group by category
  const grouped = selectedCat === "all"
    ? categories
        .map((cat: any) => ({
          cat,
          items: allProducts.filter((p: any) => p.category_id === cat.id),
        }))
        .filter((g) => g.items.length > 0)
    : categories
        .filter((cat: any) => cat.id === selectedCat)
        .map((cat: any) => ({
          cat,
          items: allProducts.filter((p: any) => p.category_id === cat.id),
        }))
        .filter((g) => g.items.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="catalog-page min-h-screen bg-white" dir="rtl">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-wrap">
        <h1 className="text-lg font-bold text-gray-900 flex-1">קטלוג מוצרים</h1>
        <Select value={selectedCat} onValueChange={setSelectedCat}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="כל הקטגוריות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name_he || cat.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Printer className="w-4 h-4" />
          הדפסה
        </button>
      </div>

      {/* Catalog content */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-full">

        {/* Print header — visible only on print */}
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
            <p className="font-medium">אין מוצרים להצגה</p>
          </div>
        )}

        {grouped.map(({ cat, items }) => (
          <div key={cat.id} className="mb-10 print:mb-6 catalog-section">
            {/* Category header */}
            <div className="mb-5 print:mb-3 pb-3 border-b-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{cat.name_he}</h2>
              {cat.name_ar && cat.name_ar !== cat.name_he && (
                <p className="text-base text-gray-500 mt-0.5">{cat.name_ar}</p>
              )}
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
              {items.map((product: any) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 print:rounded-lg print:p-3 print:border-gray-200"
                >
                  {/* Product image */}
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-gray-200 shrink-0 print:w-20 print:h-20"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 print:w-20 print:h-20">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-base font-bold text-gray-900 leading-tight">
                      {product.name}
                    </h3>
                    {product.name_ar && product.name_ar !== product.name && (
                      <p className="text-sm text-gray-500 mt-1 leading-tight">
                        {product.name_ar}
                      </p>
                    )}
                    {product.sku && (
                      <p className="text-[10px] text-gray-400 font-mono mt-1.5">
                        {product.sku}
                      </p>
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
          .bg-gray-50\\/50 { background-color: #fafafa !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default AdminCatalog;
