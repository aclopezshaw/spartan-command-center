import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  console.log("Mobile Intel Report:", body);

  return NextResponse.json({
    success: true,
    report: body,
  });
}