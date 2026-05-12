import { Instagram } from 'lucide-react';

const POSTS = [
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583912086296-be5b665036d3?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&auto=format&fit=crop&sat=-30',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80&auto=format&fit=crop',
];

export default function SnsSection() {
  return (
    <section className="container-narrow py-20">
      <div className="text-center mb-10">
        <p className="text-gold text-sm tracking-shop uppercase mb-2 flex items-center justify-center gap-2">
          <Instagram className="w-4 h-4" /> Instagram
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl">@the.nature.academy</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {POSTS.map((src, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={i}
            src={src}
            alt={`${i + 1}번째 인스타그램 게시물`}
            className="aspect-square object-cover w-full grayscale hover:grayscale-0 transition duration-500"
          />
        ))}
      </div>
    </section>
  );
}
