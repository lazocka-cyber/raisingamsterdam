// One calm line about where and how the membership is paid.
export default function PaymentNote({ style }) {
  return (
    <p className="text-white/45 text-xs" style={{ lineHeight: 1.6, ...style }}>
      You pay on Gumroad, a well-known checkout that creators worldwide use. We never see your
      card details, and your access key arrives by email right away. Gumroad charges in US
      dollars, so your bank may add a small conversion fee.
    </p>
  )
}
