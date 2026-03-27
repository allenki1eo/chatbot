import { supabase } from "./supabase";
import type { Order, OrderStatus } from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateOrderNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${num}`;
}

export function normalisePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

async function uniqueOrderNumber(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = generateOrderNumber();
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  throw new Error("Could not generate a unique order number");
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createOrder(payload: {
  customer_name: string;
  customer_phone: string;
  product_details: string;
  delivery_address: string;
  notes?: string;
}): Promise<Order> {
  const order_number = await uniqueOrderNumber();
  const phone = normalisePhone(payload.customer_phone);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number,
      customer_name: payload.customer_name,
      customer_phone: phone,
      product_details: payload.product_details,
      delivery_address: payload.delivery_address,
      notes: payload.notes ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log the initial status
  await supabase.from("order_status_log").insert({
    order_id: data.id,
    old_status: null,
    new_status: "pending",
    changed_by: "customer",
  });

  return data as Order;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Order | null;
}

export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const normalised = normalisePhone(phone);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_phone", normalised)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
  extras?: { estimated_delivery?: string; notes?: string; changed_by?: string }
): Promise<Order> {
  const existing = await getOrderByNumber(orderNumber);
  if (!existing) throw new Error("Order not found");

  const { data, error } = await supabase
    .from("orders")
    .update({
      status,
      estimated_delivery: extras?.estimated_delivery ?? existing.estimated_delivery,
      notes: extras?.notes ?? existing.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("order_number", orderNumber.toUpperCase())
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("order_status_log").insert({
    order_id: existing.id,
    old_status: existing.status,
    new_status: status,
    changed_by: extras?.changed_by ?? "system",
  });

  return data as Order;
}

export async function cancelOrder(orderNumber: string): Promise<{ cancelled: boolean; reason?: string; order: Order }> {
  const order = await getOrderByNumber(orderNumber);
  if (!order) throw new Error("Order not found");

  const nonCancellable: OrderStatus[] = ["shipped", "delivered", "cancelled"];
  if (nonCancellable.includes(order.status)) {
    return {
      cancelled: false,
      reason: `Order cannot be cancelled — it is already ${order.status}.`,
      order,
    };
  }

  const updated = await updateOrderStatus(orderNumber, "cancelled", { changed_by: "customer" });
  return { cancelled: true, order: updated };
}

export async function getStatusLog(orderId: number) {
  const { data, error } = await supabase
    .from("order_status_log")
    .select("new_status, changed_at")
    .eq("order_id", orderId)
    .order("changed_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
