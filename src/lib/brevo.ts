import { Order, OrderItem } from "@/types/database";

interface SendOrderEmailParams {
  order: Order;
  items: OrderItem[];
}

export async function sendOrderEmails({ order, items }: SendOrderEmailParams) {
  // Read and sanitize Brevo configuration from environment
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL ||
    process.env.STORE_ADMIN_EMAIL ||
    "orders@mobiledeals.qa"
  ).trim();
  const senderName = (process.env.BREVO_SENDER_NAME || "Mobile Deals Qatar").trim();
  const adminEmail = (
    process.env.BREVO_ADMIN_EMAIL ||
    process.env.STORE_ADMIN_EMAIL ||
    "admin@mobiledeals.qa"
  ).trim();

  // If no API key configured, gracefully log and return without failing order creation
  if (!apiKey) {
    console.warn(
      `[Brevo] BREVO_API_KEY not configured in environment. Skipped email dispatch for order ${order.order_reference}.`
    );
    return { success: false, reason: "BREVO_API_KEY not configured" };
  }

  if (apiKey.startsWith("xsmtpsib-")) {
    console.warn(
      `[Brevo] ⚠️ Configuration Error: Your BREVO_API_KEY starts with 'xsmtpsib-', which is an SMTP password. Brevo REST API requires an API v3 Key starting with 'xkeysib-'. Please create an API key in Brevo Dashboard -> SMTP & API -> API Keys tab.`
    );
  }

  // Generate Items Table HTML
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: left; vertical-align: middle;">
          <strong style="color: #111827; font-size: 14px;">${item.product_name}</strong>
          ${
            item.variant_name
              ? `<br><span style="color: #6b7280; font-size: 12px; display: inline-block; margin-top: 2px;">Variant: ${item.variant_name}</span>`
              : ""
          }
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #374151; font-size: 14px; vertical-align: middle;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #374151; font-size: 14px; vertical-align: middle; white-space: nowrap;">
          QAR ${item.price.toLocaleString()}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #111827; font-weight: bold; font-size: 14px; vertical-align: middle; white-space: nowrap;">
          QAR ${item.total_price.toLocaleString()}
        </td>
      </tr>
    `
    )
    .join("");

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rawPhone = order.customer_phone.replace(/[^\d]/g, "");
  const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(
    `Hello ${order.customer_name} 👋\nThank you for your Cash on Delivery order #${order.order_reference} at Mobile Deals Qatar (Total: QAR ${order.total.toLocaleString()}).\nWe are preparing your delivery!`
  )}`;

  // 1. CUSTOMER ORDER CONFIRMATION EMAIL HTML
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Mobile Deals</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
              
              <!-- Brand Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8A1538 0%, #5B0E25 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1.5px; color: #ffffff;">MOBILE DEALS</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #fecdd3; letter-spacing: 0.5px; font-weight: 500;">PREMIER TECH STORE IN QATAR</p>
                  <div style="display: inline-block; margin-top: 14px; background-color: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.3); padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: #ffffff;">
                    ✓ Cash on Delivery Order Confirmed
                  </div>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 28px 24px;">
                  <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827; font-weight: 700;">
                    Thank you for your order, ${order.customer_name}!
                  </h2>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                    We have received your Cash on Delivery order <strong>#${order.order_reference}</strong> placed on ${formattedDate}. Our fulfillment team is preparing your package for express doorstep delivery in Qatar.
                  </p>

                  <!-- Order Info Pill -->
                  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
                      <tr>
                        <td style="color: #6b7280; padding: 3px 0;">Order Reference:</td>
                        <td style="color: #8A1538; font-weight: 800; text-align: right; font-family: monospace; font-size: 14px;">${order.order_reference}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; padding: 3px 0;">Payment Method:</td>
                        <td style="color: #111827; font-weight: 700; text-align: right;">Cash on Delivery (Pay at Doorstep)</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; padding: 3px 0;">Estimated Delivery:</td>
                        <td style="color: #059669; font-weight: 700; text-align: right;">24 – 48 Hours Across Qatar</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Order Items Table -->
                  <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #111827; border-bottom: 2px solid #8A1538; padding-bottom: 6px;">
                    Order Summary
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                        <th style="padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Item</th>
                        <th style="padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Qty</th>
                        <th style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Price</th>
                        <th style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" style="padding: 10px 8px 4px; text-align: right; font-size: 13px; color: #6b7280;">Subtotal:</td>
                        <td style="padding: 10px 8px 4px; text-align: right; font-size: 13px; font-weight: 600; color: #111827;">QAR ${order.subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colspan="3" style="padding: 4px 8px; text-align: right; font-size: 13px; color: #6b7280;">Express Delivery in Qatar:</td>
                        <td style="padding: 4px 8px; text-align: right; font-size: 13px; font-weight: 700; color: #059669;">${order.delivery_fee === 0 ? "FREE" : `QAR ${order.delivery_fee}`}</td>
                      </tr>
                      <tr style="border-top: 1px solid #e5e7eb;">
                        <td colspan="3" style="padding: 12px 8px 6px; text-align: right; font-size: 15px; font-weight: 800; color: #8A1538;">Total Payable (COD):</td>
                        <td style="padding: 12px 8px 6px; text-align: right; font-size: 18px; font-weight: 900; color: #8A1538;">QAR ${order.total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <!-- Delivery Details Box -->
                  <h3 style="margin: 20px 0 10px 0; font-size: 15px; font-weight: 700; color: #111827; border-bottom: 2px solid #8A1538; padding-bottom: 6px;">
                    Delivery Information
                  </h3>
                  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; color: #374151;">
                    <p style="margin: 0 0 6px 0;"><strong>Recipient:</strong> ${order.customer_name}</p>
                    <p style="margin: 0 0 6px 0;"><strong>Phone Number:</strong> ${order.customer_phone}</p>
                    <p style="margin: 0 0 6px 0;"><strong>District / Area:</strong> ${order.area}</p>
                    ${
                      order.zone || order.street || order.building
                        ? `<p style="margin: 0 0 6px 0;"><strong>Address:</strong> ${[
                            order.zone ? `Zone ${order.zone}` : "",
                            order.street ? `Street ${order.street}` : "",
                            order.building ? `Bldg/Villa ${order.building}` : "",
                          ]
                            .filter(Boolean)
                            .join(", ")}</p>`
                        : ""
                    }
                    ${
                      order.delivery_notes
                        ? `<p style="margin: 0; color: #6b7280;"><strong>Delivery Notes:</strong> ${order.delivery_notes}</p>`
                        : ""
                    }
                  </div>

                  <!-- WhatsApp Help Callout -->
                  <div style="margin-top: 24px; padding: 16px; background-color: #fef2f2; border: 1px solid #fecdd3; border-radius: 12px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #9f1239;">
                      Need immediate assistance or have questions about delivery?
                    </p>
                    <a href="https://wa.me/97455000000?text=${encodeURIComponent(`Hello Mobile Deals, regarding my order #${order.order_reference}`)}" 
                       style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 9px 20px; border-radius: 8px;">
                      Chat on WhatsApp (+974 5500 0000)
                    </a>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
                  <p style="margin: 0 0 4px 0;">Mobile Deals Qatar • Authentic Smartphones, Gadgets & Electronics</p>
                  <p style="margin: 0;">This is an automated Cash on Delivery confirmation email.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 2. ADMIN ORDER NOTIFICATION EMAIL HTML
  const adminEmailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Cash on Delivery Order Received</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
              
              <!-- Admin Header Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; color: #ffffff; border-bottom: 4px solid #8A1538;">
                  <span style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 10px;">
                    🚨 NEW COD ORDER RECEIVED
                  </span>
                  <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">
                    Order Reference: ${order.order_reference}
                  </h1>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #94a3b8;">
                    Total to collect at doorstep: <strong style="color: #4ade80;">QAR ${order.total.toLocaleString()}</strong>
                  </p>
                </td>
              </tr>

              <!-- Admin Content -->
              <tr>
                <td style="padding: 24px;">
                  <!-- Customer Details Section -->
                  <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                    Customer &amp; Contact Info
                  </h3>
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
                    <p style="margin: 0 0 6px 0;"><strong>Name:</strong> ${order.customer_name}</p>
                    <p style="margin: 0 0 6px 0;">
                      <strong>Phone:</strong> 
                      <a href="tel:${order.customer_phone}" style="color: #8A1538; font-weight: bold; text-decoration: none;">${order.customer_phone}</a>
                    </p>
                    ${
                      order.customer_email
                        ? `<p style="margin: 0 0 6px 0;"><strong>Email:</strong> <a href="mailto:${order.customer_email}" style="color: #2563eb; text-decoration: none;">${order.customer_email}</a></p>`
                        : `<p style="margin: 0 0 6px 0; color: #94a3b8;"><strong>Email:</strong> Not provided</p>`
                    }
                    <p style="margin: 0 0 6px 0;"><strong>District / Area:</strong> ${order.area}</p>
                    ${
                      order.zone || order.street || order.building
                        ? `<p style="margin: 0 0 6px 0;"><strong>Full Address:</strong> ${[
                            order.zone ? `Zone ${order.zone}` : "",
                            order.street ? `Street ${order.street}` : "",
                            order.building ? `Bldg/Villa ${order.building}` : "",
                          ]
                            .filter(Boolean)
                            .join(", ")}</p>`
                        : ""
                    }
                    ${
                      order.delivery_notes
                        ? `<p style="margin: 0; color: #e11d48; font-weight: 600;"><strong>Delivery Notes:</strong> ${order.delivery_notes}</p>`
                        : ""
                    }
                  </div>

                  <!-- Quick Action: WhatsApp Customer -->
                  <div style="margin-bottom: 24px; text-align: center;">
                    <a href="${whatsappUrl}" 
                       style="display: block; background-color: #25D366; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 20px; border-radius: 10px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);">
                      💬 WhatsApp Customer Directly (${order.customer_phone})
                    </a>
                  </div>

                  <!-- Ordered Items Section -->
                  <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                    Ordered Items (${items.length})
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                        <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Product</th>
                        <th style="padding: 8px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Qty</th>
                        <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Unit Price</th>
                        <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" style="padding: 10px 8px 4px; text-align: right; font-size: 13px; color: #64748b;">Subtotal:</td>
                        <td style="padding: 10px 8px 4px; text-align: right; font-size: 13px; font-weight: bold; color: #0f172a;">QAR ${order.subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colspan="3" style="padding: 4px 8px; text-align: right; font-size: 13px; color: #64748b;">Delivery:</td>
                        <td style="padding: 4px 8px; text-align: right; font-size: 13px; font-weight: bold; color: #059669;">${order.delivery_fee === 0 ? "FREE" : `QAR ${order.delivery_fee}`}</td>
                      </tr>
                      <tr style="border-top: 2px solid #0f172a;">
                        <td colspan="3" style="padding: 10px 8px; text-align: right; font-size: 15px; font-weight: 900; color: #0f172a;">Amount to Collect:</td>
                        <td style="padding: 10px 8px; text-align: right; font-size: 16px; font-weight: 900; color: #059669;">QAR ${order.total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <!-- Order Timestamp & Metadata -->
                  <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #64748b;">
                    Placed: ${formattedDate} • Payment Method: Cash on Delivery (COD) • Status: Pending Dispatch
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                  Mobile Deals Qatar Admin Dispatch Notification
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  let customerEmailSuccess = false;
  let adminEmailSuccess = false;

  try {
    // 1. Send confirmation to customer (if email provided)
    if (order.customer_email && order.customer_email.trim().length > 3) {
      try {
        const customerRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: order.customer_email.trim(), name: order.customer_name }],
            subject: `Order Confirmation #${order.order_reference} - Mobile Deals Qatar`,
            htmlContent: customerEmailHtml,
          }),
        });

        if (customerRes.ok) {
          customerEmailSuccess = true;
          console.info(
            `[Brevo] Customer confirmation email sent successfully to ${order.customer_email} for #${order.order_reference}.`
          );
        } else {
          const errData = await customerRes.json().catch(() => ({}));
          console.error(
            `[Brevo] Failed to send customer confirmation email (status ${customerRes.status}):`,
            errData
          );
        }
      } catch (custErr) {
        console.error("[Brevo] Error dispatching customer email:", custErr);
      }
    }

    // 2. Send notification to admin email
    if (adminEmail && adminEmail.trim().length > 3) {
      try {
        const adminRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: adminEmail.trim(), name: "Mobile Deals Admin" }],
            subject: `🚨 New Order #${order.order_reference} (QAR ${order.total.toLocaleString()}) - ${order.customer_name}`,
            htmlContent: adminEmailHtml,
          }),
        });

        if (adminRes.ok) {
          adminEmailSuccess = true;
          console.info(
            `[Brevo] Admin notification email sent successfully to ${adminEmail} for #${order.order_reference}.`
          );
        } else {
          const adminErrData = await adminRes.json().catch(() => ({}));
          console.error(
            `[Brevo] Failed to send admin notification email (status ${adminRes.status}):`,
            adminErrData
          );
        }
      } catch (adminErr) {
        console.error("[Brevo] Error dispatching admin email:", adminErr);
      }
    }

    return {
      success: customerEmailSuccess || adminEmailSuccess,
      customerEmailSuccess,
      adminEmailSuccess,
    };
  } catch (error) {
    console.error("[Brevo] Global email dispatch error:", error);
    return { success: false, error };
  }
}
