import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});

const ok = (body) => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

const bad = (code, message) => ({
  statusCode: code,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify({ error: message }),
});

export const handler = async () => {
  try {
    const res = await ddb.send(new ScanCommand({
      TableName: process.env.TABLE_BOOKINGS,
      Limit: 200
    }));
    const items = (res.Items || []).map(x => ({
      bookingId: x.bookingId?.S,
      name: x.name?.S,
      email: x.email?.S,
      phone: x.phone?.S,
      date: x.date?.S,
      time: x.time?.S,
      notes: x.notes?.S,
      status: x.status?.S,
      createdAt: x.createdAt?.S,
    }));
    return ok({ items, count: items.length });
  } catch (e) {
    console.error(e);
    return bad(500, "Internal error");
  }
};
