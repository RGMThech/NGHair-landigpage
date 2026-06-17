import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Button } from "@/components/ui/button";
import {
  STOREFRONT_QUERY,
  formatBRL,
  isPriceTBD,
  VIV_WHATSAPP,
  storefrontApiRequest,
  type ShopifyProduct,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

const Loja = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const isAdding = useCartStore((s) => s.isLoading);

  useEffect(() => {
    (async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_QUERY, { first: 50, query: null });
        setProducts(data?.data?.products?.edges ?? []);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-16 lg:pt-44 lg:pb-24 bg-gradient-to-b from-secondary/40 to-background">
        <div className="container max-w-5xl text-center">
          <p className="font-body text-xs uppercase tracking-[0.4em] text-muted-foreground mb-5">
            Loja NGHair
          </p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-foreground leading-tight">
            Perfumaria fina <span className="italic text-primary">para ambientes</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto font-body text-base md:text-lg text-foreground/70">
            Difusores, sprays e velas que transformam qualquer espaço em um ritual de bem-estar.
            Selecionados com a mesma curadoria que você já conhece no salão.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 lg:py-24">
        <div className="container max-w-6xl">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 max-w-xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
                Em breve nossa coleção
              </h2>
              <p className="font-body text-foreground/70">
                Estamos finalizando o catálogo de aromas. Volte em instantes — ou peça uma
                recomendação pelo WhatsApp.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((p) => {
                const img = p.node.images.edges[0]?.node;
                const variant = p.node.variants.edges[0]?.node;
                const price = p.node.priceRange.minVariantPrice;
                const tbd = isPriceTBD(price.amount);
                return (
                  <div key={p.node.id} className="group flex flex-col rounded-2xl overflow-hidden bg-card border border-border/40 transition-all duration-300 hover:shadow-md">
                    <Link to={`/loja/${p.node.handle}`} className="block aspect-square bg-secondary/30 overflow-hidden">
                      {img ? (
                        <img
                          src={img.url}
                          alt={img.altText || p.node.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          Sem imagem
                        </div>
                      )}
                    </Link>
                    <div className="p-6 flex flex-col flex-1">
                      <Link to={`/loja/${p.node.handle}`}>
                        <h3 className="font-display text-xl text-foreground mb-2 hover:text-primary transition-colors">
                          {p.node.title}
                        </h3>
                      </Link>
                      <p className="font-body text-sm text-foreground/60 line-clamp-2 mb-4 flex-1">
                        {p.node.description}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-display text-lg font-medium text-foreground">
                          {formatBRL(price.amount, price.currencyCode)}
                        </span>
                        {tbd ? (
                          <Button size="sm" asChild>
                            <a href={VIV_WHATSAPP} target="_blank" rel="noopener noreferrer">
                              Consultar
                            </a>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!variant || !variant.availableForSale || isAdding}
                            onClick={() =>
                              variant && addItem({
                                product: p,
                                variantId: variant.id,
                                variantTitle: variant.title,
                                price: variant.price,
                                quantity: 1,
                                selectedOptions: variant.selectedOptions || [],
                              })
                            }
                          >
                            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <FooterSection />
      <WhatsAppFloat />
    </main>
  );
};

export default Loja;