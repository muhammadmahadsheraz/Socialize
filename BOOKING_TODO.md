# Booking TODO

## Stripe payment verification

- Before `confirmBooking()` moves seats from `reservedSeats` to `bookedSeats`, verify the `paymentIntentId` with Stripe.
- Confirm the PaymentIntent status is `succeeded`.
- Confirm the PaymentIntent belongs to the current user and reservation/event.
- Store reservation or booking metadata on the PaymentIntent when the event payment endpoint is implemented.

## Idempotency

- Add idempotency handling for booking confirmation retries.
- Recommended approach: accept an `Idempotency-Key` header or store confirmation attempts by `paymentIntentId`.
- Repeated confirm calls for the same successful payment should return the existing confirmed booking without moving seats twice.

## Refunds

- When event payment integration is implemented, create Stripe refunds for eligible confirmed booking cancellations.
- Use the saved `paymentIntentId` to create the refund.
- Add refund tracking fields to bookings, such as `refundedAt`, `refundId`, and `refundStatus`.
- Define the refund policy window, for example whether cancellation is allowed until event start, 24 hours before start, or only by admin approval.
