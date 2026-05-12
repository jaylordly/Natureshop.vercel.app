export default function BrowFooter() {
  return (
    <footer className="border-t border-[#E8DCD7] bg-[#F4ECE8]/60 mt-16">
      <div className="container-narrow py-10 text-center">
        <p className="font-serif text-base text-[#3A2D2D] mb-1">The Nature Academy · Brow Studio</p>
        <p className="text-[10px] tracking-eyebrow uppercase text-[#8B7A7A]">
          섬세한 라인, 우아한 형태
        </p>
        <p className="text-[10px] text-[#A88080]/60 mt-4">
          © {new Date().getFullYear()} The Nature Academy
        </p>
      </div>
    </footer>
  );
}
