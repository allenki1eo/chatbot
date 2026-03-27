import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];

function requireApiKey(req: NextRequest): boolean {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return true; // no key configured → open (dev mode)
  return req.headers.get("x-api-key") === apiKey;
}

// PATCH /api/orders/:orderNumber/status
// Called by your fulfillment system / admin dashboard
export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  if (!requireApiKey(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status, estimated_delivery, notes, changed_by } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const order = await updateOrderStatus(params.orderNumber, status, {
      estimated_delivery,
      notes,
      changed_by,
    });

    return NextResponse.json({
      success: true,
      message: `Order ${order.order_number} updated to "${status}"`,
      // These flat fields are convenient for Kapso.ai notification triggers
      customer_phone:     order.customer_phone,
      customer_name:      order.customer_name,
      order_number:       order.order_number,
      new_status:         order.status,
      estimated_delivery: order.estimated_delivery,
      order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update order";
    const status  = message === "Order not found" ? 404 : 500;
    console.error("[PATCH /api/orders/:orderNumber/status]", err);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
