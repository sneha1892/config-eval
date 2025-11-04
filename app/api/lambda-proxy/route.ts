import { NextRequest } from "next/server";

const LAMBDA_URL = process.env.LAMBDA_URL!;
const ORCA_API_KEY = process.env.ORCA_API_KEY!;


export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("🚀 Lambda proxy called with body:", body);

  const response = await fetch(LAMBDA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-orca-api-key": ORCA_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  console.log("🚀 Lambda proxy response:", text);

  return new Response(text, {
    status: response.status,
    headers: { "Content-Type": "text/plain" }
  });
}


