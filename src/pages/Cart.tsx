import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { getLocaleText } from "@/data/products";
import { Button } from "@/components/ui/button";

const Cart = () => {
  const { items, updateQuantity, removeItem, getSubtotal } = useCart();
  const { t, locale, localePath } = useLocale();
  const subtotal = getSubtotal();
  const shipping = subtotal > 5000 ? 0 : 250;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="section-container py-28 text-center mt-16 md:mt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ShoppingBag className="w-14 h-14 mx-auto mb-6 text-muted-foreground/30" />
            <h1 className="text-3xl font-bold mb-4">{t("cart.empty")}</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("cart.emptyText")}</p>
            <Button asChild size="lg" className="rounded-lg px-8 py-6">
              <Link to={localePath("/shop")}>{t("cart.startShopping")}<ArrowRight className="w-4 h-4 ms-2" /></Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-8 md:py-14 mt-16 md:mt-20">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-10">{t("cart.title")}</h1>
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-7">
              {items.map((item, i) => (
                <motion.div key={item.product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-5 py-6 border-b border-border">
                  <Link to={localePath(`/product/${item.product.slug}`)} className="w-24 h-28 md:w-32 md:h-40 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <Link to={localePath(`/product/${item.product.slug}`)} className="font-semibold hover:text-accent-strong transition-colors">{item.product.name}</Link>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{getLocaleText(item.product.description, locale)}</p>
                      <p className="font-semibold mt-2">{t("common.currency")}{item.product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <QuantitySelector quantity={item.quantity} onQuantityChange={(q) => updateQuantity(item.product.id, q)} />
                      <button onClick={() => removeItem(item.product.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
              <Link to={localePath("/shop")} className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" />{t("cart.continueShopping")}
              </Link>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-surface rounded-lg p-6 lg:sticky lg:top-28">
                <h2 className="text-xl font-bold mb-6">{t("cart.orderSummary")}</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("cart.subtotal")}</span><span>{t("common.currency")}{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("cart.shipping")}</span><span>{shipping === 0 ? t("cart.complimentary") : `${t("common.currency")}${shipping}`}</span></div>
                  {subtotal < 5000 && <p className="text-xs text-muted-foreground">{t("cart.freeShippingNote")}</p>}
                </div>
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between text-lg font-bold"><span>{t("cart.total")}</span><span>{t("common.currency")}{total.toLocaleString()}</span></div>
                </div>
                <Button asChild size="lg" className="w-full rounded-lg py-6 text-sm font-semibold">
                  <Link to={localePath("/checkout")}>{t("cart.checkout")}<ArrowRight className="w-4 h-4 ms-2" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Cart;