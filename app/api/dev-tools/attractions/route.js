import { NextResponse } from "next/server";
import { requireDevOnly } from "@/lib/dev-tools/dev-only.js";
import {
  appendAttraction,
  IdAlreadyExistsError,
} from "@/lib/dev-tools/attractions-file.js";
import { validateAttraction } from "@/lib/attractions/validator.js";

export async function POST(req) {
  requireDevOnly();

  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { errors: ["request body: 不是合法 JSON"] },
      { status: 400 }
    );
  }

  const result = validateAttraction(payload);
  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  try {
    appendAttraction(payload);
  } catch (err) {
    if (err instanceof IdAlreadyExistsError) {
      return NextResponse.json({ errors: [err.message] }, { status: 409 });
    }
    return NextResponse.json(
      { errors: [`寫入 attractions.json 失敗: ${err.message}`] },
      { status: 500 }
    );
  }

  return NextResponse.json({ attraction: payload }, { status: 201 });
}
