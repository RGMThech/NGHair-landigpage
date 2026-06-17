import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_BY_HANDLE_QUERY,
  formatBRL,
  isPriceTBD,
  VIV_WHATSAPP,
  storefrontApiRequest,
  type ShopifyProduct,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ShopifyProduct["node"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantIdx, setVariantIdx] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const isAdding = useCartStore((s) => s.isLoading);

  useEffect(() => {
    if (!handle) return;
    (async () => {
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        setProduct(data?.data?.product ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [handle]);

  const variant = product?.variants.edges[variantIdx]?.node;
  const tbd = variant ? isPriceTBD(variant.price.amount) : false;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="container max-w-6xl">
          <Link to="/loja" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar à loja
          </Link>
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !product ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl mb-2">Produto não encontrado</p>
              <Link to="/loja" className="text-primary underline">Ver todos os produtos</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
              <div className="aspect-square bg-secondary/30 rounded-2xl overflow-hidden">
                {product.images.edges[0]?.node && (
                  <img
                    src={product.images.edges[0].node.url}
                    alt={product.images.edges[0].node.altText || product.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-5xl font-medium text-foreground mb-4">{product.title}</h1>
                <p className="font-display text-2xl text-primary mb-6">
                  {variant ? formatBRL(variant.price.amount, variant.price.currencyCode) : ""}
                </p>
                <p className="font-body text-foreground/70 leading-relaxed mb-8 whitespace-pre-line">
                  {product.description}
                </p>
                {product.variants.edges.length > 1 && (
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Opções</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.edges.map((v, idx) => (
                        <button
                          key={v.node.id}
                          onClick={() => setVariantIdx(idx)}
                          className={`px-4 py-2 rounded-full border text-sm transition ${idx === variantIdx ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                        >
                          {v.node.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {tbd ? (
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <a href={VIV_WHATSAPP} target="_blank" rel="noopener noreferrer">
                      Consultar pelo WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    disabled={!variant || !variant.availableForSale || isAdding}
                    onClick={() => variant && product && addItem({
                      product: { node: product },
                      variantId: variant.id,
                      variantTitle: variant.title,
                      price: variant.price,
                      quantity: 1,
                      selectedOptions: variant.selectedOptions || [],
                    })}
                    className="w-full sm:w-auto"
                  >
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar à sacola"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      <FooterSection />
      <WhatsAppFloat />
    </main>
  );
};

export default ProductDetail;