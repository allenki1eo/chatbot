export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  products: string;
  total_items: number;
  delivery_address: string;
  status: OrderStatus;
  notes: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusLog {
  id: number;
  order_id: number;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string;
  changed_at: string;
}

export type ApiResponse<T = unknown> =
  | { success: true } & T
  | { success: false; error: string };
