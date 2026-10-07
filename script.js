const BASE = "https://berita-indo-api-next.vercel.app/api/"
const SUMBER = {cnn:"CNN", cnbc:"CNBC", antara:"Antara", republika:"Republika", tempo:"Tempo", suara:"Suara", merdeka:"Merdeka", okezone:"Okezone"}
const $ = id => document.getElementById(id)
let semua = [], sumberAktif = "cnn"
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))

// data cadangan kalau API gagal / offline
const DEMO = Array.from({length:9}, (_, i) => ({
    title: ["Teknologi AI mengubah wajah industri media Indonesia","Harga emas menyentuh rekor baru pekan ini","Timnas bersiap hadapi laga penentu kualifikasi","Festival film pelajar sukses digelar serentak","Cuaca ekstrem diprediksi landa sejumlah wilayah","Startup lokal raih pendanaan seri B","Wisata Nusantara kembali ramai wisatawan","Inovasi energi surya desa jadi sorotan dunia","Mahasiswa ciptakan aplikasi pantau banjir"][i],
    link:"#", isoDate:new Date(Date.now()-i*36e5*3).toISOString(),
    image:{small:`https://picsum.photos/seed/newnews${i}/800/500`}
}))

const ago = iso => {
    const d = (Date.now() - new Date(iso)) / 6e4
    if (isNaN(d)) return ""
    if (d < 60) return `${Math.max(1,Math.floor(d))} menit lalu`
    if (d < 1440) return `${Math.floor(d/60)} jam lalu`
    return `${Math.floor(d/1440)} hari lalu`
}
const gbr = b => b.image?.small || b.image?.large || b.image || `https://picsum.photos/seed/${encodeURIComponent(b.title||"x")}/800/500`

/* ---------- PRELOADER ---------- */
let pct = 0
const hitung = setInterval(() => { pct = Math.min(pct + Math.random()*9, 90); $("preloader").querySelector(".pre-count").textContent = Math.floor(pct)+"%" }, 120)
function tutupPreloader(){
    clearInterval(hitung)
    $("preloader").querySelector(".pre-count").textContent = "100%"
    setTimeout(() => { $("preloader").classList.add("keluar"); setTimeout(() => $("preloader").style.display="none", 950) }, 500)
}

/* ---------- AMBIL DATA ---------- */
function muat(kode){
    sumberAktif = kode
    $("berita").innerHTML = ""; $("hero").innerHTML = ""
    return fetch(`${BASE}${kode}-news`)
        .then(hasil => hasil.json())
        .then(tempat => { semua = (tempat.data || []).filter(b => b.title); if(!semua.length) throw 0 })
        .catch(() => { semua = DEMO; console.warn("API gagal, memakai data demo") })
        .then(() => { render(); ticker() })
}

/* ---------- RENDER ---------- */
function render(filter = ""){
    const q = filter.toLowerCase()
    const list = semua.filter(b => b.title.toLowerCase().includes(q))
    $("kosong").hidden = list.length > 0
    const [utama, ...sisa] = q ? [null, ...list] : list
    $("hero").innerHTML = utama ? `
        <a class="hero-card" href="${esc(utama.link)}" target="_blank" rel="noopener">
            <img src="${esc(gbr(utama))}" alt="">
            <div class="hero-isi">
                <span class="badge">Sorotan Utama</span>
                <h1>${esc(utama.title).split(" ").map((k,i)=>`<span class="k" style="animation-delay:${i*.045}s">${k}&nbsp;</span>`).join("")}</h1>
                <small>${SUMBER[sumberAktif]} · ${ago(utama.isoDate)}</small>
            </div>
        </a>` : ""
    $("berita").innerHTML = sisa.map((b, i) => `
        <article>
            <div class="gambar"><img src="${esc(gbr(b))}" alt="" loading="lazy"><span class="no">${String(i+1).padStart(2,"0")}</span></div>
            <h2>${esc(b.title)}</h2>
            <div class="meta">${SUMBER[sumberAktif]} · ${ago(b.isoDate)}</div>
            <a href="${esc(b.link)}" target="_blank" rel="noopener">klik untuk lihat sumber</a>
        </article>`).join("")
    pasangEfek()
}

function ticker(){
    const t = semua.slice(0,10).map(b => `<span>${esc(b.title)}</span>`).join("")
    $("ticker-track").innerHTML = t + t
}

/* ---------- EFEK ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
    if(e.isIntersecting){ e.target.style.transitionDelay = `${(e.target.dataset.i % 3) * 90}ms`; e.target.classList.add("tampil"); io.unobserve(e.target)
        setTimeout(() => { e.target.style.transitionDelay = "0ms"; e.target.classList.add("tilt") }, 900) }
}), {threshold:.12})

function pasangEfek(){
    document.querySelectorAll("#berita article").forEach((a, i) => {
        a.dataset.i = i; io.observe(a)
        a.addEventListener("mousemove", e => {
            if(!a.classList.contains("tilt")) return
            const r = a.getBoundingClientRect(), x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/r.height-.5
            a.style.transform = `rotateY(${x*10}deg) rotateX(${-y*10}deg) translateY(-6px)`
        })
        a.addEventListener("mouseleave", () => a.style.transform = "")
    })
    const h = document.querySelector(".hero-card")
    if(h){
        h.addEventListener("mousemove", e => { const r=h.getBoundingClientRect(); h.style.transform=`rotateY(${((e.clientX-r.left)/r.width-.5)*6}deg) rotateX(${-((e.clientY-r.top)/r.height-.5)*6}deg)` })
        h.addEventListener("mouseleave", () => h.style.transform = "")
    }
}

// tabs sumber
$("tabs").innerHTML = Object.entries(SUMBER).map(([k,v]) => `<button data-k="${k}" class="${k===sumberAktif?"aktif":""}">${v}</button>`).join("")
$("tabs").addEventListener("click", e => {
    const k = e.target.dataset.k; if(!k) return
    document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("aktif", b.dataset.k === k))
    $("cari").value = ""; muat(k)
})

$("cari").addEventListener("input", e => render(e.target.value))

// tema
const simpan = localStorage.getItem("tema")
if(simpan) document.documentElement.dataset.tema = simpan
$("tema").onclick = () => {
    const t = document.documentElement.dataset.tema === "terang" ? "gelap" : "terang"
    document.documentElement.dataset.tema = t; localStorage.setItem("tema", t)
}

// glow kursor + progress scroll + parallax hero
let mx = innerWidth/2, my = innerHeight/2, gx = mx, gy = my
addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY })
;(function loop(){ gx += (mx-gx)*.1; gy += (my-gy)*.1; $("glow").style.left = gx+"px"; $("glow").style.top = gy+"px"; requestAnimationFrame(loop) })()
addEventListener("scroll", () => {
    const s = document.documentElement
    $("progress").style.width = (s.scrollTop/(s.scrollHeight-s.clientHeight)*100)+"%"
    const img = document.querySelector(".hero-card img"); if(img) img.style.translate = `0 ${scrollY*.12}px`
})

muat(sumberAktif).then(tutupPreloader)
