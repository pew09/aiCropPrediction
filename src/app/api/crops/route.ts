import { NextResponse } from "next/server";
import { db } from "@/db";
import { crops, priceHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const availableCrops = await db
      .select({
        id: crops.id,
        name: crops.name,
        category: crops.category,
        unit: crops.unit,
        seasonStart: crops.seasonStart,
        seasonEnd: crops.seasonEnd,
        basePrice: crops.basePrice,
        region: crops.region,
        createdAt: crops.createdAt,
      })
      .from(crops)
      .innerJoin(priceHistory, eq(crops.id, priceHistory.cropId))
      .groupBy(
        crops.id,
        crops.name,
        crops.category,
        crops.unit,
        crops.seasonStart,
        crops.seasonEnd,
        crops.basePrice,
        crops.region,
        crops.createdAt
      )
      .orderBy(crops.name);

    return NextResponse.json({ success: true, data: availableCrops });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}