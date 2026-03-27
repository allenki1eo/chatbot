import { NextRequest, NextResponse } from "next/server";
import { cancelOrder, getOrderByNumber } from "@/lib/orders";

// POST /api/orders/:orderNumber/cancel
// Called by Kapso.ai Cancel Order workflow
export async function POST(
  _req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const existing = await getOrderByNumber(params.orderNumber);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Order ${params.orderNumber} not found.` },
        { status: 404 }
      );
    }

    const result = await cancelOrder(params.orderNumber);

    if (!result.cancelled) {
      return NextResponse.json(
        { success: false, cancellable: false, error: result.reason },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      cancellable: true,
      message: `Order ${result.order.order_number} has been cancelled.`,
      order_number: result.order.order_number,
      order: result.order,
    });
  } catch (err) {
    console.error("[POST /api/orders/:orderNumber/cancel]", err);
    return NextResponse.json({ success: false, error: "Failed to cancel order" }, { status: 500 });
  }
}
