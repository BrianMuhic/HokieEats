import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DINING_LOCATIONS } from "@/lib/dining-config";

const schema = z.object({
  diningHall: z.string().min(1),
  restaurant: z.string().min(1),
  mealDescription: z.string().min(10).max(500),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    const { diningHall, restaurant, mealDescription } = parsed.data;

    const validHall = DINING_LOCATIONS.some(
      (d) => d.name === diningHall || d.id === diningHall
    );
    if (!validHall) {
      return NextResponse.json(
        { error: "Invalid dining hall." },
        { status: 400 }
      );
    }

    const location = DINING_LOCATIONS.find(
      (d) => d.name === diningHall || d.id === diningHall
    );
    if (!location?.restaurants.includes(restaurant)) {
      return NextResponse.json(
        { error: "Invalid restaurant for this dining hall." },
        { status: 400 }
      );
    }

    const request = await prisma.mealRequest.create({
      data: {
        requesterId: session.userId,
        diningHall: location.name,
        restaurant,
        mealDescription: mealDescription.trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: request.id });
  } catch (err) {
    console.error("Create meal request error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
