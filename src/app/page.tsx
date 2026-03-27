export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>WhatsApp Order Bot API</h1>
      <p>This service provides order management endpoints for the Kapso.ai WhatsApp chatbot.</p>
      <h2>Endpoints</h2>
      <ul>
        <li><code>GET  /api/health</code> — Health check</li>
        <li><code>POST /api/orders</code> — Place a new order</li>
        <li><code>GET  /api/orders/:orderNumber</code> — Track an order</li>
        <li><code>GET  /api/orders/phone/:phone</code> — Order history by phone</li>
        <li><code>POST /api/orders/:orderNumber/cancel</code> — Cancel an order</li>
        <li><code>PATCH /api/orders/:orderNumber/status</code> — Update status (admin, requires <code>x-api-key</code>)</li>
      </ul>
    </main>
  );
}
