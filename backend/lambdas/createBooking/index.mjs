// Node.js 18+ runtime. Uses AWS SDK v3 (built into Lambda).
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Environment variables (already set via CLI):
// BOOKINGS_TABLE=Bookings
// SLOTLOCKS_TABLE=SlotLocks
const BOOKINGS_TABLE  = process.env.BOOKINGS_TABLE;
const SLOTLOCKS_TABLE = process.env.SLOTLOCKS_TABLE;

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    // Minimal validation
    const required = ["clientName","email","date","startTime","durationMins","package","price"];
    const missing = required.filter(k => body[k] === undefined || body[k] === null || body[k] === "");
    if (missing.length) {
      return json(400, { error: `Missing fields: ${missing.join(", ")}` });
    }

    // Derive identifiers
    const bookingId = randomUUID();
    const slotKey   = `${body.date}#${body.startTime}`;
    const nowIso    = new Date().toISOString();

    const bookingItem = {
      bookingId,
      clientName: body.clientName,
      email: body.email,
      phone: body.phone || null,
      date: body.date,
      startTime: body.startTime,
      durationMins: Number(body.durationMins),
      package: body.package,
      price: Number(body.price),
      status: "pending",                // will become "paid"/"confirmed" after Stripe webhook
      slotKey,
      clientRequestId: body.clientRequestId || null,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // Atomic write: create booking + lock the slot
    const cmd = new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: BOOKINGS_TABLE,
            Item: bookingItem,
            // Optional: add a ConditionExpression if you later add idempotency via clientRequestId GSI
          }
        },
        {
          Put: {
            TableName: SLOTLOCKS_TABLE,
            Item: {
              slotKey,
              bookingId,
              lockedAt: nowIso
            },
            ConditionExpression: "attribute_not_exists(slotKey)" // prevents double-book
          }
        }
      ]
    });

    await ddb.send(cmd);

    return json(201, {
      success: true,
      booking: {
        bookingId,
        status: "pending",
        date: bookingItem.date,
        startTime: bookingItem.startTime,
        package: bookingItem.package,
        price: bookingItem.price
      }
    });

  } catch (err) {
    // If the slot is already taken, DynamoDB will cancel the transaction due to the condition
    if (err?.name === "TransactionCanceledException") {
      const lockFailed = (err.CancellationReasons || []).some(r => r?.Code === "ConditionalCheckFailed");
      if (lockFailed) {
        return json(409, { error: "That time slot was just taken. Please pick another." });
      }
    }
    console.error("createBooking error:", err);
    return json(500, { error: "Internal error creating booking." });
  }
};

function json(statusCode, body) {
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