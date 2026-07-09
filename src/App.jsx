import { useState } from 'react'
import EngineeringTerminal from './EngineeringTerminal'

const NAV_LINKS = [
  { href: '#uslugi', label: 'Услуги' },
  { href: '#terminal', label: 'Терминал' },
  { href: '#jarbol', label: 'Истакнат Проект' },
  { href: '#portfolio', label: 'Портфолио' },
  { href: '#proekti', label: 'Реализации' },
  { href: '#tehnologija', label: 'Технологија' },
  { href: '#kontakt', label: 'Контакт' },
]

const SERVICES = [
  {
    module: 'Модул 01',
    title: 'Интегрирано Проектирање',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 11h.01M15 11h.01" />
      </svg>
    ),
    text: 'Комплетна изработка на Основен и Главен Проект. Еден договор, еден одговорен тим - Главен Проектант кој ги координира сите фази.',
    items: [
      'Архитектонско проектирање',
      'Водовод и канализација',
      'Електрични инсталации',
      'Машинство и термотехника',
      'ППЗ елаборати',
    ],
  },
  {
    module: 'Модул 02',
    title: 'Структурно Инженерство',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21l6-6M3 21v-4m0 4h4M14 4l6 6M9 9l10.5 10.5M4 4l5 5M14 4l-2 2 6 6 2-2-6-6zM4 4l2-2 3 3-2 2-3-3z" />
      </svg>
    ),
    text: 'Нашето јадро и примарна експертиза. Оптимизирани конструкции кои штедат материјал и време, совршено усогласени со архитектонската идеја.',
    items: [
      'Специјализирани статички пресметки',
      'Челични и АБ конструкции',
      'Сеизмичка анализа (EN 1998)',
      'Детални работилнички цртежи',
    ],
  },
  {
    module: 'Модул 03',
    title: 'Комплексен Надзор',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 18h16M4 18v-4a8 8 0 0 1 16 0v4M12 6V4m0 14v3M2 21h20" />
      </svg>
    ),
    text: 'Бескомпромисна контрола на градилиште, од првиот ископ до технички прием. Штитиме и квалитет и инвестиција.',
    items: [
      'Главен надзор на објект',
      'Контрола на сите фази на изведба',
      'Одобрување на материјали',
      'Технички прием',
    ],
  },
]

const PORTFOLIO = [
  {
    id: 'ST-045',
    project: 'Станбена Зграда П+6',
    detail: 'Скопје',
    scope: 'Комплетен Проект (Сите фази)',
    status: 'Активен',
    done: false,
  },
  {
    id: 'ST-044',
    project: 'Индустриски Комплекс ТИРЗ',
    detail: '12,000 m2',
    scope: 'Комплетен Проект + Надзор',
    status: 'Завршен',
    done: true,
  },
  {
    id: 'ST-042',
    project: 'Челичен Јарбол за Рефлектори 35m',
    detail: 'Високо-мачтова конструкција',
    scope: 'Само Статика',
    status: 'Завршен',
    done: true,
  },
  {
    id: 'ST-041',
    project: 'Индустриска Хала',
    detail: 'Илинден',
    scope: 'Комплетен Проект + Надзор',
    status: 'Активен',
    done: false,
  },
  {
    id: 'ST-038',
    project: 'Висечки Мост, ревизија',
    detail: 'Инфраструктура',
    scope: 'Консултации / Ревизија',
    status: 'Завршен',
    done: true,
  },
]

const MAST_SPECS = [
  ['Вкупна висина', '35.0 m'],
  ['Сегменти', '4 × 10.0 m, преклопни'],
  ['Профил', 'Полигонален, 18 страни'],
  ['Дијаметар', 'Ø1600 (база) → Ø630 (врв)'],
  ['Дебелина на ѕид', '8 / 7 / 7 / 6 mm'],
  ['Анкерни завртки', '18 × M36 × 1800 mm'],
  ['Базна плоча', 'Ø2000 × 40 mm'],
  ['Темел', 'C(25/30), 4×4×2 m'],
  ['Вкупна тежина', '7,821 kg (+5% цинк)'],
]

const GALLERY = [
  { src: '/assets/hala_intermetal.png', label: 'Челична Хала „Интерметал“', tag: 'Проектирање' },
  { src: '/assets/nadzor.jpg', label: 'Индивидуален Објект, Сопиште', tag: 'Надзор' },
  { src: '/assets/hala_strumica.jpg', label: 'Производна Хала, Струмица', tag: 'Проектирање' },
  { src: '/assets/nadzor_petrovec.jpg', label: 'Армирано-бетонска Плоча, Петровец', tag: 'Надзор' },
  { src: '/assets/magacin_strumica.jpg', label: 'Магацински Простор, Струмица', tag: 'Проектирање' },
  { src: '/assets/nadzor_temeli.jpg', label: 'Темелна Конструкција', tag: 'Надзор' },
  { src: '/assets/asfaltna_baza.jpg', label: 'Асфалтна База, конструкции', tag: 'Проектирање' },
  { src: '/assets/nadzor_aerial.jpg', label: 'Градилиште, воздушна контрола', tag: 'Надзор' },
  { src: '/assets/zgrada_hrom_bw.jpg', label: 'Станбена Зграда, Хром', tag: 'Проектирање' },
]

const TECH = [
  {
    title: 'BIM Координација (Revit & Tekla)',
    text: 'Целиот проект живее во еден координиран BIM модел. Нема колизии меѓу архитектура, конструкција и инсталации - нема непријатни изненадувања на терен.',
  },
  {
    title: 'Архитектура (ArchiCAD & AutoCAD)',
    text: 'Архитектонските основи и деталите се изработуваат во индустриски стандарден софтвер, целосно компатибилен со фајловите на соработниците и институциите.',
  },
  {
    title: 'Напредна Статика (SAP2000 & Tower)',
    text: 'За инвеститорите, ова гарантира дека објектот е сеизмички отпорен и безбеден, проектиран со најмоќниот софтвер во индустријата.',
  },
]

const TECH_STACK = ['Autodesk Revit', 'Tekla Structures', 'ArchiCAD', 'AutoCAD', 'SAP2000', 'Tower']

function SectionTitle({ kicker, title }) {
  return (
    <div className="mb-12">
      <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        {kicker}
      </p>
      <h2 className="font-heading mt-2 text-3xl font-bold text-ink md:text-4xl">{title}</h2>
      <div className="mt-4 h-[2px] w-16 bg-accent" />
    </div>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-paper">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <a href="#top" className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="Статера Инженеринг лого" className="h-8 w-auto" />
            <span className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-ink">
              Statera <span className="text-accent">Engineering</span>
            </span>
          </a>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-heading text-xs font-medium uppercase tracking-[0.12em] text-ink/70 hover:text-accent"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href="#kontakt"
            className="font-heading ml-8 hidden border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink hover:border-accent hover:bg-accent hover:text-white lg:block"
          >
            Закажи средба
          </a>
          <button
            type="button"
            aria-label={menuOpen ? 'Затвори мени' : 'Отвори мени'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-ink lg:hidden"
          >
            <span className={`h-[1.5px] w-5 bg-ink transition ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
            <span className={`h-[1.5px] w-5 bg-ink transition ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-ink/10 bg-card lg:hidden">
            <div className="flex flex-col divide-y divide-ink/10">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-heading px-4 py-4 text-sm font-medium uppercase tracking-[0.12em] text-ink/80 hover:bg-paper/60 hover:text-accent"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#kontakt"
                onClick={() => setMenuOpen(false)}
                className="font-heading bg-accent px-4 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white"
              >
                Закажи средба
              </a>
            </div>
          </nav>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section id="top" className="grid-paper border-b border-ink/10 bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Основен и Главен Проект · Стручен Надзор
            </p>
            <h1 className="font-heading mt-4 text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
              Интегрирано проектирање и надзор.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/70">
              Комплетна изработка на Основен и Главен Проект (Архитектура, Статика, МЕП) - од
              концептуално решение до стручен надзор на градилиште. Еден тим, целосна
              одговорност.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#portfolio"
                className="font-heading bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white hover:bg-ink"
              >
                Погледни портфолио
              </a>
              <a
                href="#uslugi"
                className="font-heading border border-ink px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-ink hover:border-accent hover:text-accent"
              >
                Нашите услуги
              </a>
            </div>
          </div>
          <figure className="border border-ink/15 bg-card p-2">
            <img
              src="/assets/hero-render.jpg"
              alt="Преклоп од технички blueprint и финална изведба на објект"
              className="h-auto w-full"
            />
            <figcaption className="font-heading flex justify-between px-2 py-2 text-[11px] uppercase tracking-[0.15em] text-ink/50">
              <span>Од blueprint до изведба</span>
              <span>Fig. 01</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Two target groups ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <SectionTitle kicker="Позиционирање" title="Две целни групи, еден интерфејс" />
        <div className="grid gap-6 md:grid-cols-2">
          <article className="border-t-2 border-accent bg-card p-8">
            <h3 className="font-heading text-xl font-bold text-accent">За Архитекти</h3>
            <p className="mt-4 leading-relaxed text-ink/75">
              Архитектите бараат естетска свест, прецизност и флексибилност. Дизајнот мора да
              дише и да изгледа како технички уреден простор.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink/80">
              {['Фокус на BIM интеграција', 'Визуелна хиерархија без „тежок“ текст', 'Почитување на архитектонската визија'].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-[7px] h-[6px] w-[6px] shrink-0 bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </article>
          <article className="border-t-2 border-accent bg-card p-8">
            <h3 className="font-heading text-xl font-bold text-accent">За Инвеститори</h3>
            <p className="mt-4 leading-relaxed text-ink/75">
              Инвеститорите немаат време за технички детали. Тие бараат авторитет, минимизирање
              на ризикот, оптимизација на буџетот и јасни статуси на проектите.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink/80">
              {['Јасен приказ на ROI (заштеда на материјали)', 'Строго придржување до стандарди (EN)', 'Прегледен статус на тековни проекти'].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-[7px] h-[6px] w-[6px] shrink-0 bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────── */}
      <section id="uslugi" className="border-y border-ink/10 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <SectionTitle kicker="Модули на услуги" title="Комплетен инженеринг, три модули" />
          <div className="grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <article key={s.title} className="flex flex-col border border-ink/10 border-t-2 border-t-accent bg-paper/40 p-8">
                <div className="flex items-start justify-between">
                  <div className="text-accent">{s.icon}</div>
                  <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60">
                    {s.module}
                  </p>
                </div>
                <h3 className="font-heading mt-6 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{s.text}</p>
                <ul className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm text-ink/80">
                  {s.items.map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="mt-[7px] h-[6px] w-[6px] shrink-0 bg-accent" />
                      {t}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Numbers / formula ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <SectionTitle kicker="Бројки кои градат доверба" title="Сигурност втемелена во математика" />
        <div className="grid items-start gap-10 md:grid-cols-2">
          <div className="border-l-2 border-accent pl-8">
            <p className="font-heading text-7xl font-bold text-accent md:text-8xl">100%</p>
            <p className="font-heading mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink">
              Усогласеност со Еврокодови
            </p>
            <p className="mt-6 max-w-md leading-relaxed text-ink/70">
              На секој проект му претходи ригорозна контрола на напрегањата, целосно усогласена
              со важечките Еврокодови.
            </p>
          </div>
          <div>
            <div className="border border-ink/10 border-l-2 border-l-accent bg-card px-8 py-10 text-center">
              <p className="font-heading text-4xl tracking-wide text-ink md:text-5xl">
                E<sub className="text-2xl">d</sub> ≤ R<sub className="text-2xl">d</sub>
              </p>
            </div>
            <p className="mt-4 text-sm italic leading-relaxed text-ink/60">
              Проектното влијание на дејствата (E<sub>d</sub>) секогаш помало или еднакво на
              проектната носивост (R<sub>d</sub>).
            </p>
          </div>
        </div>
      </section>

      {/* ── Engineering Terminal ───────────────────────────────── */}
      <EngineeringTerminal />

      {/* ── Featured project: 35m mast ─────────────────────────── */}
      <section id="jarbol" className="border-y border-ink/10 bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-5 md:px-6 md:py-24">
          <div className="min-w-0 md:col-span-3">
            <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
              Истакнат проект
            </p>
            <h2 className="font-heading mt-2 text-3xl font-bold md:text-4xl">
              Челичен јарбол за рефлектори, H = 35 m
            </h2>
            <div className="mt-4 h-[2px] w-16 bg-sky-400" />
            <p className="mt-6 max-w-xl leading-relaxed text-white/70">
              Високо-мачтова челична конструкција за осветлување: четири преклопни сегменти со
              полигонален профил од 18 страни, фиксна глава за рефлектори и громобранска
              заштита. Комплетна статичка анализа, диспозиција и работилнички детали -
              изработени во Статера Инженеринг.
            </p>
            <p className="font-heading mt-8 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 md:hidden">
              Лизгај за повеќе →
            </p>
            <div className="scroll-fade mt-2 overflow-x-auto md:mt-8">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <tbody>
                  {MAST_SPECS.map(([k, v]) => (
                    <tr key={k} className="border-b border-white/15">
                      <td className="font-heading py-3 pr-6 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                        {k}
                      </td>
                      <td className="font-heading py-3 font-medium text-white">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <figure className="md:col-span-2">
            <div className="border border-white/20 bg-white p-2">
              <img
                src="/assets/jarbol_35m.png"
                alt="Технички цртеж: челичен јарбол за рефлектори со висина 35 метри"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="font-heading mt-3 flex justify-between text-[11px] uppercase tracking-[0.15em] text-white/50">
              <span>Диспозиција 1:100 · A2</span>
              <span>Fig. 02</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Portfolio table ────────────────────────────────────── */}
      <section id="portfolio" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <SectionTitle kicker="За инвеститори" title="Приказ на портфолио" />
        <p className="font-heading mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink/40 md:hidden">
          Лизгај за повеќе →
        </p>
        <div className="scroll-fade overflow-x-auto border border-ink/10 bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-paper/60">
                {['ID', 'Проект', 'Опсег на работа', 'Статус'].map((h) => (
                  <th
                    key={h}
                    className="font-heading px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-ink/60"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO.map((row) => (
                <tr key={row.id} className="border-b border-ink/10 last:border-b-0">
                  <td className="font-heading px-6 py-5 text-xs font-semibold tracking-[0.1em] text-ink/60">
                    {row.id}
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-heading font-bold text-ink">{row.project}</p>
                    <p className="mt-1 text-xs text-ink/50">{row.detail}</p>
                  </td>
                  <td className="font-heading px-6 py-5 font-medium text-ink/80">{row.scope}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`font-heading inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] ${
                        row.done ? 'text-green-700' : 'text-orange-600'
                      }`}
                    >
                      <span className={`h-2 w-2 ${row.done ? 'bg-green-700' : 'bg-orange-600'}`} />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Gallery ────────────────────────────────────────────── */}
      <section id="proekti" className="border-y border-ink/10 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <SectionTitle kicker="Реализации" title="Од цртеж до градилиште" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.map((g) => (
              <figure key={g.src} className="group border border-ink/10 bg-paper/40">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={g.src}
                    alt={g.label}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale-[30%] transition group-hover:grayscale-0"
                  />
                </div>
                <figcaption className="px-4 py-3">
                  <p className="font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-accent">
                    {g.tag}
                  </p>
                  <p className="font-heading mt-1 text-sm font-medium text-ink">{g.label}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology ─────────────────────────────────────────── */}
      <section id="tehnologija" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <SectionTitle kicker="Технологија" title="Технологија во служба на проектот" />
        <div className="grid gap-6 md:grid-cols-3">
          {TECH.map((t, i) => (
            <article key={t.title} className="border border-ink/10 bg-card p-8">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-ink/60">
                0{i + 1}
              </p>
              <h3 className="font-heading mt-4 text-lg font-bold text-accent">{t.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{t.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-0 gap-y-2 border border-ink/10 bg-card">
          <p className="font-heading border-r border-ink/10 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60">
            Технички стак
          </p>
          {TECH_STACK.map((t) => (
            <span
              key={t}
              className="font-heading border-r border-ink/10 px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70 last:border-r-0"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Contact / Footer ───────────────────────────────────── */}
      <footer id="kontakt" className="border-t border-ink/10 bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-3xl font-bold md:text-4xl">Подготвени за изведба?</h2>
              <p className="mt-4 max-w-md leading-relaxed text-white/70">
                Секој проект поминува низ ист процес: концепт, статичка верификација, изведба.
                Контактирајте нè за проектирање, надзор или ревизија на постоечки проект.
              </p>
              <a
                href="mailto:info@statera.mk"
                className="font-heading mt-8 inline-block bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-ink hover:bg-sky-400 hover:text-white"
              >
                info@statera.mk
              </a>
            </div>
            <div className="flex flex-col justify-between gap-8 md:items-end">
              <div className="flex items-center gap-3">
                <span className="font-heading text-sm font-bold uppercase tracking-[0.15em]">
                  Statera Engineering
                </span>
              </div>
              <div className="font-heading text-xs uppercase tracking-[0.15em] text-white/50 md:text-right">
                <p>Скопје, Република Македонија</p>
                <p className="mt-2">Интегрирано Проектирање · Статика · Стручен Надзор</p>
              </div>
            </div>
          </div>
          <div className="font-heading mt-14 border-t border-white/15 pt-6 text-[11px] uppercase tracking-[0.15em] text-white/40">
            <p>© {new Date().getFullYear()} Статера Инженеринг. Сите права задржани.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
