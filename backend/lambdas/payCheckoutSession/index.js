// Node.js 20.x — ES modules
// Env vars required in Lambda: STRIPE_SECRET_KEY, SUCCESS_URL, CANCEL_URL
import Stripe from "stripe";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Tables from your existing env
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE; // blakely-cinematics-bookings

export const handler = async (event) => {
  try {
    // Accept either bookingId (preferred) or inline data
    const body = JSON.parse(event.body || "{}");
    const {
      bookingId,
      // fallback fields if you choose to create a session without a prior booking
      clientName,
      email,
      date,
      startTime,
      package: pkg,
      price // in cents
    } = body;

    if (!price || !Number.isFinite(Number(price))) {
      return res(400, { error: "Missing or invalid 'price' (cents)." });
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pkg || "Photography Session",
              description: bookingId
                ? `Booking #${bookingId}`
                : `Session: ${date ?? ""} ${startTime ?? ""}`.trim()
            },
            unit_amount: Number(price)
          },
          quantity: 1
        }
      ],
      success_url: process.env.SUCCESS_URL + "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: process.env.CANCEL_URL
    });

    // (Optional but helpful) attach the Stripe session id to the booking for lookup later
    if (bookingId) {
      try {
        await ddb.send(
          new UpdateCommand({
            TableName: BOOKINGS_TABLE,
            Key: { bookingId },
            UpdateExpression:
              "SET stripeCheckoutSessionId = :sid, updatedAt = :now",
            ExpressionAttributeValues: {
              ":sid": session.id,
              ":now": new Date().toISOString()
            }
          })
        );
      } catch (e) {
      }
    }

    return res(200, { url: session.url, sessionId: session.id });
  } catch (err) {
    return res(500, { error: "Failed to create checkout session." });
  }
};

function res(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST"
    },
    body: JSON.stringify(body)
  };
}