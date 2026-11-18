import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import {
  createProductInputSchema,
  listProductsInputSchema,
  PRODUCTS_CACHE_TAG,
} from "@/features/products/schema";
import { createProduct, listProducts } from "@/server/products/repository";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";

export const productsRouter = createTRPCRouter({
  /** `cursor` é a página (1-based), não um id. */
  list: publicProcedure.input(listProductsInputSchema).query(({ input }) =>
    listProducts({
      page: input.cursor ?? 1,
      limit: input.limit,
    }),
  ),

  create: publicProcedure.input(createProductInputSchema).mutation(async ({ input }) => {
    const product = await createProduct({ ...input, id: nanoid() });

    // `{ expire: 0 }` força a próxima leitura a enxergar o produto recém-criado.
    revalidateTag(PRODUCTS_CACHE_TAG, { expire: 0 });

    return product;
  }),
});
