import { MEMBERSHIP_DISCOUNT_URL, MEMBERSHIP_DISCOUNT_PRICE, MEMBERSHIP_PRICE } from '../lib/listingUtils'

// Where and how the membership is paid, plus the first-100 discount.
// Parents didn't know Gumroad and the old tiny grey line was easy to miss.
export default function PaymentNote({ style }) {
  return (
    <div style={{ ...style }}>
      {MEMBERSHIP_DISCOUNT_URL && (
        <p className="text-white text-sm" style={{ lineHeight: 1.55, marginBottom: 10 }}>
          <strong>
            First 100 families pay {MEMBERSHIP_DISCOUNT_PRICE} instead of {MEMBERSHIP_PRICE}.
          </strong>{' '}
          <a
            href={MEMBERSHIP_DISCOUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#34d399', textDecoration: 'underline', fontWeight: 700 }}
          >
            Use this link to get the discount
          </a>
          .
        </p>
      )}
      <p className="text-white/75 text-sm" style={{ lineHeight: 1.6 }}>
        <strong className="text-white">Secure payment via Gumroad.</strong> Gumroad is a US payment
        platform that creators worldwide have used since 2011. It is less known in Europe, so the
        name may be new to you. You can pay by card, PayPal or Apple Pay where available. We never
        see your card details, and your access key arrives by email right away. Gumroad charges in
        US dollars, so your bank may add a small conversion fee.
      </p>
    </div>
  )
}
