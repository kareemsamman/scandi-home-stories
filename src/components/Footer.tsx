import { Link } from "react-router-dom";
import { collections } from "@/data/products";

export const Footer = () => {
  return (
    <footer className="bg-linen border-t border-border">
      <div className="container-wide py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="font-serif text-2xl tracking-tight text-foreground">
              Maison
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Curated home objects and lifestyle pieces for considered living.
            </p>
          </div>

          {/* Collections */}
          <div>
            <h4 className="font-serif text-lg mb-4">Collections</h4>
            <ul className="space-y-2">
              {collections.slice(0, 6).map((collection) => (
                <li key={collection.id}>
                  <Link
                    to={`/products?collection=${collection.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif text-lg mb-4">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/products"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Shop All
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  to="/inquiry"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Inquire
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Saved Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif text-lg mb-4">Stay Connected</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Receive updates on new arrivals and seasonal collections.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-2 text-sm bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Maison. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Shipping
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
