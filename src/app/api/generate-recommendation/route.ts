import { NextResponse } from "next/server";
import { db } from "@/db";
import { regions, crops } from "@/db/schema";
import { RuleEngine, knowledgeBase } from "@/lib/rules";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    console.log("AI Recommendation endpoint hit");
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("regionId");
    const month = new Date().getMonth() + 1;

    if (!regionId || isNaN(parseInt(regionId))) {
        console.error("Validation Error: regionId is missing or invalid", { regionId });
        return NextResponse.json({ success: false, error: "A valid Region ID is required." }, { status: 400 });
    }
    console.log(`Received request for regionId: ${regionId}`);

    let region;
    try {
        console.log("Step 1: Fetching region from database...");
        const regionResult = await db.select().from(regions).where(eq(regions.id, parseInt(regionId)));
        if (regionResult.length === 0) {
            console.error(`Database Error: Region with ID ${regionId} not found.`);
            return NextResponse.json({ success: false, error: "Region not found in database." }, { status: 404 });
        }
        region = regionResult[0];
        console.log("Step 1 SUCCESS: Found region:", region.name);
    } catch (error: any) {
        console.error("CRITICAL ERROR at Step 1 (Fetching Region):", error);
        return NextResponse.json({ success: false, error: "Failed to query database for region.", details: error.message }, { status: 500 });
    }

    let recommendedCropName;
    try {
        console.log("Step 2: Evaluating rule engine...");
        const ruleEngine = new RuleEngine(knowledgeBase);
        const facts = {
            region: region.name,
            month: month,
            soilType: region.soilType || "loam",
            climate: region.climate || "tropical",
        };
        recommendedCropName = ruleEngine.evaluate(facts);
        console.log(`Step 2 SUCCESS: Rule engine recommended: ${recommendedCropName}`);
    } catch (error: any) {
        console.error("CRITICAL ERROR at Step 2 (Rule Engine):", error);
        return NextResponse.json({ success: false, error: "Rule engine evaluation failed.", details: error.message }, { status: 500 });
    }

    let cropResult;
    try {
        console.log(`Step 3: Fetching recommended crop '${recommendedCropName}' from database...`);
        cropResult = await db.select().from(crops).where(eq(crops.name, recommendedCropName));
        if (cropResult.length === 0) {
            console.error(`Database Error: Recommended crop '${recommendedCropName}' not found in database.`);
            return NextResponse.json({ success: false, error: `Recommended crop '${recommendedCropName}' not found in database.` }, { status: 404 });
        }
        console.log("Step 3 SUCCESS: Found crop details in database.");
    } catch (error: any) {
        console.error("CRITICAL ERROR at Step 3 (Fetching Crop):", error);
        return NextResponse.json({ success: false, error: "Failed to query database for recommended crop.", details: error.message }, { status: 500 });
    }

    try {
        console.log("Step 4: Constructing final JSON response...");
        const response = {
            success: true,
            data: {
                recommendedCrop: cropResult[0],
                reasoning: `Based on the location '${region.name}' and the current month, '${recommendedCropName}' is a suitable crop to plant.`,
            },
        };
        console.log("Step 4 SUCCESS: Response constructed. Sending to client.");
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("CRITICAL ERROR at Step 4 (Constructing Response):", error);
        return NextResponse.json({ success: false, error: "Failed to construct final JSON response.", details: error.message }, { status: 500 });
    }
}