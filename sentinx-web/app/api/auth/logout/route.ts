import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).delete("sx_jwt");
  return NextResponse.json({ ok: true });
}
