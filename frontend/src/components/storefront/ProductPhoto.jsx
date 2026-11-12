import { useState } from "react";
import StoreIcon from "./StoreIcon";

function Photo({ id, url, name, className }) {
  const [attempt, setAttempt] = useState(0);
  // Use the stored URL, then the existing database-image endpoint.
  const safeUrl =
    typeof url === "string" && /^(https?:\/\/|\/(?!\/))/.test(url) ? url : null;
  const sources = [
    ...new Set(
      [safeUrl, id ? `/api/products/${id}/image` : null].filter(Boolean),
    ),
  ];
  return attempt < sources.length ? (
    <img
      className={className}
      src={sources[attempt]}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setAttempt(attempt + 1)}
    />
  ) : (
    <span
      className={`${className} fm-photo-missing`}
      role="img"
      aria-label={`No photo available for ${name}`}
    >
      <StoreIcon name="bag" size={38} />
    </span>
  );
}

export default function ProductPhoto(props) {
  return <Photo key={`${props.id}:${props.url || ""}`} {...props} />;
}
