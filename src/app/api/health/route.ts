import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Lightweight health endpoint — used by the Docker HEALTHCHECK.
export async function GET() {
  try {
    const count = await prisma.bike.count();
    return NextResponse.json({ status: "ok", bikes: count }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
