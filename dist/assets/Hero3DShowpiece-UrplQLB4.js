import{r as i,j as e,bh as x,H as m,S as b,a2 as g}from"./index-DoeiSATn.js";function h({className:o="",height:d="600px"}){const a=i.useRef(null);return i.useEffect(()=>{const t=a.current;if(!t)return;const r=l=>{const s=t.getBoundingClientRect(),n=(l.clientX-s.left-s.width/2)/s.width,c=(l.clientY-s.top-s.height/2)/s.height;t.style.setProperty("--mouse-x",`${n*15}deg`),t.style.setProperty("--mouse-y",`${-c*15}deg`)};return t.addEventListener("mousemove",r),()=>t.removeEventListener("mousemove",r)},[]),e.jsxs("div",{ref:a,className:`relative w-full overflow-hidden ${o}`,style:{height:d,perspective:"1200px","--mouse-x":"0deg","--mouse-y":"0deg"},children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-teal-50/50 dark:from-slate-950 dark:via-blue-950/30 dark:to-teal-950/30"}),e.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:e.jsxs("div",{className:"relative w-full h-full max-w-[1400px] mx-auto",style:{transform:"rotateX(var(--mouse-y)) rotateY(var(--mouse-x))",transformStyle:"preserve-3d",transition:"transform 0.1s ease-out"},children:[e.jsx("div",{className:"hidden md:block absolute right-[10%] top-[20%] glass-card profile-card",style:{transform:"translateZ(80px)",transformStyle:"preserve-3d"},children:e.jsxs("div",{className:"relative z-10 p-8 flex flex-col items-center",children:[e.jsxs("div",{className:"relative mb-4",children:[e.jsx("div",{className:"w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl",children:"SJ"}),e.jsx("div",{className:"absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg",children:e.jsx(x,{size:16})})]}),e.jsx("h3",{className:"text-2xl font-bold text-gray-900 dark:text-white mb-1",children:"Sarah Johnson"}),e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-300 mb-3",children:"Luxury Real Estate Specialist"}),e.jsxs("div",{className:"flex items-center gap-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full",children:[e.jsx(m,{size:12}),e.jsx("span",{children:"Beverly Hills, CA"})]})]})}),e.jsx("div",{className:"hidden md:block absolute right-[2%] top-[55%] glass-card listing-card",style:{transform:"translateZ(120px) rotateY(-10deg)",transformStyle:"preserve-3d"},children:e.jsxs("div",{className:"relative z-10",children:[e.jsxs("div",{className:"h-32 bg-gradient-to-br from-slate-300 to-slate-400 rounded-t-xl relative overflow-hidden",children:[e.jsx("div",{className:"absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"}),e.jsx("div",{className:"absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-bold",children:"$2,450,000"}),e.jsx("div",{className:"absolute top-2 right-2 bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg transform rotate-12",children:"SOLD"})]}),e.jsxs("div",{className:"p-4",children:[e.jsx("h4",{className:"font-bold text-gray-900 dark:text-white text-sm mb-1",children:"Modern Hills Villa"}),e.jsx("p",{className:"text-xs text-gray-500",children:"4 Bed • 3.5 Bath • 3,200 sqft"})]})]})}),e.jsx("div",{className:"hidden md:block absolute left-[45%] bottom-[15%] glass-card stats-card",style:{transform:"translateZ(60px) rotateX(10deg)",transformStyle:"preserve-3d"},children:e.jsxs("div",{className:"relative z-10 p-6 text-center",children:[e.jsx("div",{className:"text-4xl font-bold text-blue-500 mb-2",children:"28"}),e.jsxs("div",{className:"text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1",children:[e.jsx(b,{size:14}),e.jsx("span",{children:"Deals Closed"})]})]})}),e.jsx("div",{className:"hidden md:block absolute left-[5%] bottom-[20%] glass-card stats-card opacity-80",style:{transform:"translateZ(30px) rotateY(15deg)",transformStyle:"preserve-3d"},children:e.jsxs("div",{className:"relative z-10 p-6 text-center",children:[e.jsx("div",{className:"text-4xl font-bold text-emerald-500 mb-2",children:"142"}),e.jsxs("div",{className:"text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1",children:[e.jsx(g,{size:14}),e.jsx("span",{children:"Active Leads"})]})]})}),e.jsx("div",{className:"floating-orb orb-1",style:{right:"25%",top:"15%",transform:"translateZ(-50px)"}}),e.jsx("div",{className:"floating-orb orb-2",style:{left:"10%",bottom:"30%",transform:"translateZ(-80px)"}})]})}),e.jsx("style",{jsx:!0,children:`
        .glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          animation: float 8s ease-in-out infinite;
          transition: transform 0.1s ease-out;
        }

        .profile-card {
          width: 300px;
          animation-delay: 0s;
        }

        .listing-card {
          width: 260px;
          animation-delay: 1.5s;
        }

        .stats-card {
          width: 180px;
          animation-delay: 2.5s;
        }

        .floating-orb {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(45, 212, 191, 0.2));
          filter: blur(40px);
          animation: pulse 6s ease-in-out infinite;
        }

        .orb-1 { animation-delay: 0s; }
        .orb-2 { animation-delay: 3s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) translateZ(var(--z, 0)); }
          50% { transform: translateY(-15px) translateZ(var(--z, 0)); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }

        @media (prefers-color-scheme: dark) {
          .glass-card {
            background: rgba(30, 41, 59, 0.6);
            border-color: rgba(148, 163, 184, 0.1);
          }
        }
      `})]})}export{h as Hero3DShowpiece};
