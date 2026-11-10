/* Avatar original da Lia: uma senhora simpática de óculos (o mesmo do Guia+). */
export function LiaAvatar({
  falando = false,
  className = "",
}: {
  falando?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={`${className} ${falando ? "lia-falando" : ""}`}
    >
      <path d="M34 222c0-46 28-72 66-72s66 26 66 72z" fill="#27407A" />
      <path d="M78 150l22 32 22-32z" fill="#F7EFE2" />
      <path
        d="M78 150l22 32M122 150l-22 32"
        stroke="#1B2D57"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="100" cy="196" r="4" fill="#F2C94C" />
      <rect x="88" y="124" width="24" height="32" rx="10" fill="#E2A882" />
      <circle cx="100" cy="34" r="20" fill="#A3A6AD" />
      <path
        d="M86 30q14-10 28 0"
        fill="none"
        stroke="#878A92"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="100" cy="92" rx="54" ry="52" fill="#A3A6AD" />
      <circle cx="52" cy="102" r="9" fill="#E2A882" />
      <circle cx="148" cy="102" r="9" fill="#E2A882" />
      <circle cx="51" cy="115" r="4.5" fill="#FFFFFF" stroke="#C9B27C" strokeWidth="1.5" />
      <circle cx="149" cy="115" r="4.5" fill="#FFFFFF" stroke="#C9B27C" strokeWidth="1.5" />
      <ellipse cx="100" cy="98" rx="44" ry="47" fill="#F2C29E" />
      <path d="M56 92c0-32 19-50 44-50s44 18 44 50c-9-17-25-26-44-26s-35 9-44 26z" fill="#B9BCC2" />
      <path
        d="M70 80q11-6 22 0M108 80q11-6 22 0"
        fill="none"
        stroke="#7D8088"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="82" cy="98" r="4.5" fill="#2B2B33" />
      <circle cx="118" cy="98" r="4.5" fill="#2B2B33" />
      <g fill="none" stroke="#3A3F4B" strokeWidth="3">
        <circle cx="82" cy="98" r="14" />
        <circle cx="118" cy="98" r="14" />
        <path d="M96 97q4-3 8 0M68 96l-12-4M132 96l12-4" />
      </g>
      <path
        d="M100 104q-5 9 1 11"
        fill="none"
        stroke="#C98B6B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="68" cy="118" r="7" fill="#E89A86" opacity=".55" />
      <circle cx="132" cy="118" r="7" fill="#E89A86" opacity=".55" />
      <path
        className="lia-boca"
        d="M86 124q14 13 28 0"
        fill="none"
        stroke="#8E3527"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <ellipse className="lia-boca-aberta" cx="100" cy="128" rx="9" ry="7" fill="#8E3527" />
    </svg>
  );
}
