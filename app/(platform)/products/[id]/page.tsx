import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductDetail } from "@/features/feedbacks/components/product-detail";
import { ProductDetailSkeleton } from "@/features/feedbacks/components/product-detail-skeleton";

export const metadata: Metadata = {
  title: "Detalhes do produto",
  description: "Ficha do produto com avaliações de quem já testou.",
};

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

async function ProductContent({ params }: ProductPageProps) {
  const { id } = await params;

  return <ProductDetail productId={id} />;
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}
