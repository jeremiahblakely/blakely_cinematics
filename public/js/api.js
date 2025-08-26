window.createBooking = async function (payload) {
  const res = await fetch(window.API_BASE + "/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("createBooking failed: " + res.status);
  return res.json();
};

window.listBookings = async function () {
  const res = await fetch(window.API_BASE + "/bookings");
  if (!res.ok) throw new Error("listBookings failed: " + res.status);
  return res.json();
};