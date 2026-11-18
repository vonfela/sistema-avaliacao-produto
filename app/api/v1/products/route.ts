import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createProductInputSchema,
  PRODUCTS_CACHE_TAG,
  PRODUCTS_MAX_PAGE,
  PRODUCTS_PAGE_SIZE,
  PRODUCTS_PAGE_SIZE_MAX,
} from "@/features/products/schema";
import { createProduct, listProducts } from "@/server/products/repository";

/**
 * Contrato público do catálogo:
 *   GET  /api/v1/products?page=1&limit=12  ->  200 | 400 | 500
 *   POST /api/v1/products                  ->  201 | 400 | 500
 *        body: { name, link, image, description? }
 *          ou  { name, externalLink, imageUrl, description? }
 *
 * A leitura é pública e usa o mesmo repositório cacheado da home. A escrita é
 * manual e propositalmente aberta nesta entrega; proteger antes de produção.
 */

const listProductsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("A página precisa ser um número inteiro.")
    .min(1, "A página começa em 1.")
    .max(PRODUCTS_MAX_PAGE, "Página fora do limite.")
    .default(1),
  limit: z.coerce
    .number()
    .int("O limite precisa ser um número inteiro.")
    .min(1, "O limite mínimo é 1.")
    .max(PRODUCTS_PAGE_SIZE_MAX, `O limite máximo é ${PRODUCTS_PAGE_SIZE_MAX}.`)
    .default(PRODUCTS_PAGE_SIZE),
});

function validationIssues(error: z.ZodError, fieldAliases: Record<string, string> = {}) {
  return error.issues.map((issue) => {
    const field = issue.path.join(".");
    return { field: fieldAliases[field] ?? field, message: issue.message };
  });
}

/**
 * Aceita o formato curto usado por integrações (ex.: N8N) além do camelCase:
 *   { name, link, image }  ->  { name, externalLink, imageUrl }
 * Se os dois formatos vierem juntos, o camelCase vence. Os erros de validação
 * voltam com o nome do campo que o cliente realmente enviou.
 */
function normalizeCreateProductBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { data: body, fieldAliases: {} };
  }

  const { link, image, ...rest } = body as Record<string, unknown>;
  const fieldAliases: Record<string, string> = {};

  if (rest.externalLink === undefined && link !== undefined) {
    rest.externalLink = link;
    fieldAliases.externalLink = "link";
  }

  if (rest.imageUrl === undefined && image !== undefined) {
    rest.imageUrl = image;
    fieldAliases.imageUrl = "image";
  }

  return { data: rest, fieldAliases };
}

export async function GET(request: NextRequest) {
  const parsed = listProductsQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Parâmetros inválidos.",
        issues: validationIssues(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const page = await listProducts(parsed.data);

    return NextResponse.json(page, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/products] erro inesperado", error);

    return NextResponse.json(
      { message: "Não foi possível carregar os produtos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Corpo da requisição inválido: envie um JSON." },
      { status: 400 },
    );
  }

  const { data, fieldAliases } = normalizeCreateProductBody(body);
  const parsed = createProductInputSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos.",
        issues: validationIssues(parsed.error, fieldAliases),
      },
      { status: 400 },
    );
  }

  try {
    const product = await createProduct({ ...parsed.data, id: nanoid() });

    // A home é cacheada por tag; sem isso o produto novo só apareceria depois
    // do cacheLife expirar.
    revalidateTag(PRODUCTS_CACHE_TAG, { expire: 0 });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/products] erro inesperado", error);

    return NextResponse.json({ message: "Não foi possível criar o produto." }, { status: 500 });
  }
}
