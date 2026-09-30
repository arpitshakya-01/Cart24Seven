import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
    { title: "Big Electronics Sale", subtitle: "Upgrade your everyday with great deals on tech.", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1800&auto=format&fit=crop&q=85", label: "Technology" },
    { title: "Find Your New Style", subtitle: "Explore fresh looks, shoes, and everyday essentials.", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1800&auto=format&fit=crop&q=85", label: "Fashion" },
    { title: "Books & New Ideas", subtitle: "Discover stories and learning for wherever life takes you.", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1800&auto=format&fit=crop&q=85", label: "Books" },
];

function HeroSlider() {
    const [current, setCurrent] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setCurrent((index) => (index + 1) % slides.length), 5500);
        return () => clearInterval(timer);
    }, []);
    const slide = slides[current];

    return <section className="mx-auto mt-4 w-full max-w-screen-2xl px-3 sm:mt-6 sm:px-6 lg:px-8">
        <div className="relative isolate min-h-[320px] overflow-hidden rounded-3xl bg-slate-900 shadow-xl sm:min-h-[390px] lg:min-h-[470px]">
            <img src={slide.image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover"/>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#090909]/85 via-[#111111]/50 to-[#111111]/10"/>
            <div className="flex min-h-[320px] items-center px-8 py-12 sm:min-h-[390px] sm:px-14 lg:min-h-[470px] lg:px-20"><div className="max-w-2xl text-white">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#FFD21F] backdrop-blur-sm">Cart24Seven · {slide.label}</span>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{slide.title}</h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/85 sm:text-xl sm:leading-8">{slide.subtitle}</p>
                <Link to="/categories" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#FFD21F] px-6 py-3.5 font-bold text-[#111111] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#E8B900]">Explore categories<ArrowRight size={19}/></Link>
            </div></div>
            <button type="button" aria-label="Previous slide" onClick={() => setCurrent((current - 1 + slides.length) % slides.length)} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md transition hover:bg-[#FFD21F] sm:left-5 sm:h-12 sm:w-12"><ChevronLeft size={23}/></button>
            <button type="button" aria-label="Next slide" onClick={() => setCurrent((current + 1) % slides.length)} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md transition hover:bg-[#FFD21F] sm:right-5 sm:h-12 sm:w-12"><ChevronRight size={23}/></button>
            <div className="absolute bottom-5 right-6 flex items-center gap-2 sm:right-10">{slides.map((item, index) => <button key={item.title} type="button" aria-label={`Show slide ${index + 1}`} aria-current={current === index} onClick={() => setCurrent(index)} className={`h-2.5 rounded-full transition-all ${current === index ? "w-8 bg-[#FFD21F]" : "w-2.5 bg-white/75 hover:bg-white"}`}/>)}</div>
        </div>
    </section>;
}

export default HeroSlider;
