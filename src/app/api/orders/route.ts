import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";

// POST /api/orders
// Called by Kapso.ai Place Order workflow
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_name, customer_phone, products, total_items, delivery_address, notes } = body;

    if (!customer_name || !customer_phone || !products || !delivery_address) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: customer_name, customer_phone, products, delivery_address" },
        { status: 400 }
      );
    }

    const order = await createOrder({
      customer_name,
      customer_phone,
      products,
      total_items: Number(total_items) || 1,
      delivery_address,
      notes,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Order placed! Your order number is ${order.order_number}`,
        order,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 });
  }
}
