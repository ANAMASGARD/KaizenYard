export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M 32 0 L 128 0 L 192 64 L 192 128 L 128 192 L 32 192 L 0 160 L 0 32 Z M 64 64 L 64 128 L 128 128 L 128 64 Z M 160 64 L 224 64 L 256 96 L 256 160 L 224 192 L 160 192 L 128 160 L 128 96 Z"
        fill="currentColor"
      />
    </svg>
  );
}
