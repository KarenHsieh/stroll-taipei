import { NextResponse } from "next/server";
import { requireDevOnly } from "@/lib/dev-tools/dev-only.js";
import {
  updateAttraction,
  IdNotFoundError,
} from "@/lib/dev-tools/attractions-file.js";
import { validateAttraction } from "@/lib/attractions/validator.js";
import { getTagPool } from "@/lib/tags/index.js";

export async function PUT(req, { params }) {
  requireDevOnly();

  const { id: urlId } = await params;

  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { errors: ["request body: 不是合法 JSON"] },
      { status: 400 }
    );
  }

  if (payload?.id !== urlId) {
    return NextResponse.json(
      { errors: ["body.id 必須與 URL 上的 id 一致"] },
      { status: 400 }
    );
  }

  const result = validateAttraction(payload, getTagPool(payload.edition_id));
  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  try {
    updateAttraction(urlId, payload);
  } catch (err) {
    if (err instanceof IdNotFoundError) {
      return NextResponse.json({ errors: [err.message] }, { status: 404 });
    }
    return NextResponse.json(
      { errors: [`寫入 attractions.json 失敗: ${err.message}`] },
      { status: 500 }
    );
  }

  return NextResponse.json({ attraction: payload }, { status: 200 });
}
