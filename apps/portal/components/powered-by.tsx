import Image from "next/image";

export function PoweredBy() {
  return (
    <footer className="powered-by">
      <a href="https://septnex.com" target="_blank" rel="noopener noreferrer">
        <Image
          src="/branding/septnex-signature.png"
          alt="SEPTNEX"
          width={96}
          height={60}
          loading="eager"
          unoptimized
        />
      </a>
    </footer>
  );
}
