import { NextRequest, NextResponse } from "next/server";
import { getOrdersByPhone } from "@/lib/orders";

// GET /api/orders/phone/:phone
// Called by Kapso.ai Order History workflow
export async function GET(
  _req: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const orders = await getOrdersByPhone(params.phone);

    return NextResponse.json({
      success: true,
      count: orders.length,
      message: orders.length === 0 ? "No orders found for this phone number." : undefined,
      orders,
    });
  } catch (err) {
    console.error("[GET /api/orders/phone/:phone]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}
