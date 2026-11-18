import { NextResponse } from "next/server";
import { feedbackInputSchema } from "@/features/feedbacks/schema";
import { getSession } from "@/server/auth/session";
import { listFeedbacks, upsertFeedback } from "@/server/feedbacks/repository";
import { getProductById } from "@/server/products/repository";

/**
 * Avaliações de um produto.
 *
 *   GET  /api/v1/products/[id]/feedbacks  ->  200 | 404 | 500
 *   POST /api/v1/products/[id]/feedbacks  ->  200 | 400 | 401 | 404 | 500
 *
 * O autor vem exclusivamente da sessão; qualquer `createdBy` no corpo é
 * ignorado pelo schema.
 */

const PRODUCT_NOT_FOUND_MESSAGE = "Produto não encontrado.";
const UNAUTHORIZED_MESSAGE = "Você precisa entrar para avaliar este produto.";
const LOAD_ERROR_MESSAGE = "Não foi possível carregar as avaliações.";
const SAVE_ERROR_MESSAGE = "Não foi possível salvar sua avaliação.";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ message: PRODUCT_NOT_FOUND_MESSAGE }, { status: 404 });
    }

    const items = await listFeedbacks(id);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[GET /api/v1/products/[id]/feedbacks] erro inesperado", error);

    return NextResponse.json({ message: LOAD_ERROR_MESSAGE }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Corpo da requisição inválido: envie um JSON." },
      { status: 400 },
    );
  }

  const parsed = feedbackInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos.",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: UNAUTHORIZED_MESSAGE }, { status: 401 });
    }

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ message: PRODUCT_NOT_FOUND_MESSAGE }, { status: 404 });
    }

    const feedback = await upsertFeedback({
      productId: id,
      createdBy: session.id,
      score: parsed.data.score,
      comment: parsed.data.comment,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("[POST /api/v1/products/[id]/feedbacks] erro inesperado", error);

    return NextResponse.json({ message: SAVE_ERROR_MESSAGE }, { status: 500 });
  }
}
