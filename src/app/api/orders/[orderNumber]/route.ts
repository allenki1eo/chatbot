import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber, getStatusLog } from "@/lib/orders";

// GET /api/orders/:orderNumber
// Called by Kapso.ai Track Order workflow
export async function GET(
  _req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const order = await getOrderByNumber(params.orderNumber);

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order ${params.orderNumber} not found. Please check the order number and try again.` },
        { status: 404 }
      );
    }

    const status_history = await getStatusLog(order.id);

    return NextResponse.json({ success: true, order: { ...order, status_history } });
  } catch (err) {
    console.error("[GET /api/orders/:orderNumber]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}
