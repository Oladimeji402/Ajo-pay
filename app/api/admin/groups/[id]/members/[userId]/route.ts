import { NextResponse } from "next/server";

export async function DELETE() {
  return NextResponse.json(
    { error: "Admin group member management has been disabled." },
    { status: 410 },
  );
}
