import { Link } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "@/hooks/useWishlist";
import { collections } from "@/data/products";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items } = useWishlist();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="font-serif text-2xl md:text-3xl tracking-tight text-foreground">
            Maison
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-sm font-medium tracking-wide uppercase">
                    Collections
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-1 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {collections.map((collection) => (
                        <li key={collection.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/products?collection=${collection.slug}`}
                              className={cn(
                                "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                            >
                              <div className="text-sm font-medium leading-none">{collection.name}</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {collection.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link
              to="/products"
              className="text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              Shop All
            </Link>

            <Link
              to="/about"
              className="text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              About
            </Link>

            <Link
              to="/inquiry"
              className="text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              Inquire
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <Link to="/wishlist" className="relative p-2 hover:bg-accent rounded-sm transition-colors">
              <Heart className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 hover:bg-accent rounded-sm transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground px-2">Collections</p>
                  {collections.slice(0, 6).map((collection) => (
                    <Link
                      key={collection.id}
                      to={`/products?collection=${collection.slug}`}
                      className="block px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {collection.name}
                    </Link>
                  ))}
                </div>
                <div className="pt-4 border-t border-border space-y-2">
                  <Link
                    to="/products"
                    className="block px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Shop All
                  </Link>
                  <Link
                    to="/about"
                    className="block px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/inquiry"
                    className="block px-2 py-2 text-sm font-medium hover:bg-accent rounded-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Inquire
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
