import { useState } from 'react'

/* ────────────────────────────────────────────────────────────────
   MATH / DATA LAYER — pure functions, no UI concerns
   ──────────────────────────────────────────────────────────────── */

// Tab 1a: RC slabs/beams — EN 1992-1-1 (EC2) Table 7.4N span/effective-depth
// ratios. The table gives two bounds per system: highly-stressed concrete
// (ρ = 1.5%, the smaller L/d, i.e. thicker/conservative) and lightly-
// stressed concrete (ρ = 0.5%, the larger L/d, i.e. thinner). Flat slabs are
// slab-only (no beam equivalent — a beam can't be "supported directly on
// columns without beams"). Values and the two-way/flat-slab span notes are
// taken as given; nothing here is interpolated or invented.
const RC_SYSTEMS = {
  simple: {
    label: 'Слободно потпрена (еднонасочна или двонасочна)',
    highLd: 14,
    lowLd: 20,
    appliesTo: ['slab', 'beam'],
    spanNote: null,
  },
  end_span: {
    label: 'Краен распон на континуирана (надворешно поле)',
    highLd: 18,
    lowLd: 26,
    appliesTo: ['slab', 'beam'],
    spanNote: null,
  },
  interior_span: {
    label: 'Внатрешен распон на континуирана (внатрешно поле)',
    highLd: 20,
    lowLd: 30,
    appliesTo: ['slab', 'beam'],
    spanNote: null,
  },
  flat_slab: {
    label: 'Рамна плоча на столбови без греди (Flat Slab)',
    highLd: 17,
    lowLd: 24,
    appliesTo: ['slab'],
    spanNote: 'longer',
  },
  cantilever: {
    label: 'Конзола (Cantilever)',
    highLd: 6,
    lowLd: 8,
    appliesTo: ['slab', 'beam'],
    spanNote: null,
  },
}

const ELEMENT_KINDS = {
  slab: { label: 'Плоча', unit: 'дебелина' },
  beam: { label: 'Греда', unit: 'висина' },
}

function calcPredimension(elementKind, systemId, stressLevel, spanMeters) {
  const system = RC_SYSTEMS[systemId]
  if (!system || !system.appliesTo.includes(elementKind)) return null
  if (!Number.isFinite(spanMeters) || spanMeters <= 0 || spanMeters > 30) return null
  const ratio = stressLevel === 'high' ? system.highLd : system.lowLd
  const rawMm = (spanMeters * 1000) / ratio
  const roundedMm = Math.ceil(rawMm / 10) * 10 // round up to 10 mm
  return {
    mm: roundedMm,
    ratio,
    highLd: system.highLd,
    lowLd: system.lowLd,
    unit: ELEMENT_KINDS[elementKind].unit,
    spanNote: system.spanNote,
  }
}

// Tab 1b: Steel / composite construction — EN 1993 / EN 1994. These are
// published typical span and depth RANGES, not a span/depth formula — so
// the calculator does not compute a single number here. It only checks
// whether the entered span falls inside the documented typical range and
// echoes back the associated typical total depth range, verbatim.
const FLOOR_SYSTEMS = {
  composite_deck: {
    label: 'Спрегнати плочи со челичен профилиран лим',
    spanMin: 2.5,
    spanMax: 3.6,
    depthLabel: '110 mm до 150 mm',
    note: 'Пр. профилиран лим 60 mm + надбетон 70 mm = вкупно 130 mm',
  },
  precast: {
    label: 'Претходно излеани бетонски плочи (Precast)',
    spanMin: 3,
    spanMax: 6,
    depthLabel: '110 mm до 200 mm',
    note: null,
  },
  insitu: {
    label: 'Монолитни бетонски плочи на лице место (In-situ)',
    spanMin: 3,
    spanMax: 6,
    depthLabel: '150 mm до 250 mm',
    note: null,
  },
}

function checkFloorSpan(systemId, spanMeters) {
  const sys = FLOOR_SYSTEMS[systemId]
  if (!sys || !Number.isFinite(spanMeters) || spanMeters <= 0) return null
  const inRange = spanMeters >= sys.spanMin && spanMeters <= sys.spanMax
  return { inRange, depthLabel: sys.depthLabel, note: sys.note, spanMin: sys.spanMin, spanMax: sys.spanMax }
}

// Static reference values (not span-dependent) for steel beam economic spans
const STEEL_BEAM_SPANS = [
  { label: 'Секундарни греди', range: '8 до 12 m' },
  { label: 'Примарни главни греди - спрегната плоча', range: '5 до 7 m' },
  { label: 'Примарни главни греди - монолитна/префабрикувана плоча', range: '6 до 8 m' },
]

// Tab 2: gross estimation factors by building type/level. concretePerM2 is
// the "Препорачано за алатката" (recommended) value from each type's
// Мин.-Макс. m3/m2 range; rebarPerM3 stays flat at 100 kg/m3 across types
// (no differentiated rebar table given).
const PURPOSE_FACTORS = {
  lowrise_residential: { label: 'Станбена нискокатница (до П+3)', concretePerM2: 0.32, rebarPerM3: 100 },
  highrise_residential: { label: 'Станбена високoкатница', concretePerM2: 0.37, rebarPerM3: 100 },
  business: { label: 'Деловен објект (поголеми распони)', concretePerM2: 0.4, rebarPerM3: 100 },
  underground_garage: { label: 'Подземно гаражно ниво', concretePerM2: 0.38, rebarPerM3: 100 },
}

// Foundation concrete supplement: burial depth is approximated as N/6 floor-
// heights, so every 6 floors adds one buried level, each costing ~0.5 m3/m2
// of the single-floor footprint area (not multiplied by floor count -- it's
// a one-off substructure quantity, not a repeating per-floor one).
const FOUNDATION_M3_PER_LEVEL = 0.5
const FOUNDATION_FLOORS_PER_LEVEL = 6

function calcMaterialEstimate(areaM2, floors, purpose) {
  const f = PURPOSE_FACTORS[purpose]
  if (!f || !Number.isFinite(areaM2) || areaM2 <= 0 || !Number.isFinite(floors) || floors <= 0)
    return null
  const totalArea = areaM2 * floors
  const superstructureConcreteM3 = totalArea * f.concretePerM2
  const buriedLevels = Math.ceil(floors / FOUNDATION_FLOORS_PER_LEVEL)
  const foundationConcreteM3 = areaM2 * buriedLevels * FOUNDATION_M3_PER_LEVEL
  const totalConcreteM3 = superstructureConcreteM3 + foundationConcreteM3
  const rebarKg = totalConcreteM3 * f.rebarPerM3
  return {
    concretePerM2: f.concretePerM2,
    rebarPerM3: f.rebarPerM3,
    superstructureConcreteM3: Math.round(superstructureConcreteM3),
    buriedLevels,
    foundationConcreteM3: Math.round(foundationConcreteM3),
    concreteM3: Math.round(totalConcreteM3),
    rebarTons: (rebarKg / 1000).toFixed(1),
    totalArea,
  }
}

// Tab 4: urban-planning feasibility. Deliberately has NO built-in
// coefficient table — Кф (building coverage ratio) and Кпи (floor-area
// ratio) limits vary by municipality and by zone within each GUP/DUP plan,
// and there's no reliable sourced table for these. The architect already
// has the real numbers from their site's Извод од ДУП/ГУП; this function
// only does the derived arithmetic, never assumes a zoning value.
function calcUrbanFeasibility(plotArea, kf, kpi, greenPct, parkingRatio) {
  if (!Number.isFinite(plotArea) || plotArea <= 0) return null
  if (!Number.isFinite(kf) || kf <= 0 || kf > 1) return null
  if (!Number.isFinite(kpi) || kpi <= 0) return null

  const footprint = plotArea * kf
  const maxGFA = plotArea * kpi
  const avgFloors = kpi / kf

  const greenAreaRequired =
    Number.isFinite(greenPct) && greenPct > 0 ? plotArea * (greenPct / 100) : null
  const parkingSpaces =
    Number.isFinite(parkingRatio) && parkingRatio > 0 ? Math.ceil((maxGFA / 100) * parkingRatio) : null

  return { footprint, maxGFA, avgFloors, greenAreaRequired, parkingSpaces }
}

// Tab 3 climate data. TWO independent official sources, tracked separately:
//
// sk (snow) — read off the official МКС EN 1991-1-3 snow-load band map for
//   North Macedonia. This map is banded in 0.5 kN/m² steps (≤0.5 … ≤4.5),
//   so every sk here is a BAND UPPER BOUND (e.g. the ≤1.5 band → 1.5),
//   accurate to about ±0.25, and is an approximate visual read at country
//   zoom — cities near a band boundary or under terrain shading are less
//   certain. The map caps at ≤4.5, so no value here exceeds 4.5 (an earlier
//   station-study table had 5.3 / 6.9 for the high peaks — above the design
//   map's scale — and those were corrected down into the mapped band).
//   Highest-mountain reads (Попова Шапка, Маврово) are the least certain.
//
// vb0 (wind, 50-yr) — EXACT table value for 9 stations (vb0Source:'table');
//   for the other 11 it's an approximate read off the isotach map by
//   geographic position (vb0Source:'map'), rendered with a "~" and a
//   distinct badge. Never invented where no read was possible.
const CLIMATE_DATA = [
  { city: 'Скопје', sk: 1.0, vb0: 24.3, vb0Source: 'table' },
  { city: 'Скопје Аеродром', sk: 1.0, vb0: 24, vb0Source: 'map' },
  { city: 'Битола', sk: 1.5, vb0: 18.7, vb0Source: 'table' },
  { city: 'Штип', sk: 1.0, vb0: 28.3, vb0Source: 'table' },
  { city: 'Охрид', sk: 1.5, vb0: 29.3, vb0Source: 'table' },
  { city: 'Прилеп', sk: 1.5, vb0: 21.3, vb0Source: 'table' },
  { city: 'Демир Капија', sk: 1.0, vb0: 21, vb0Source: 'map' },
  { city: 'Гевгелија', sk: 1.0, vb0: 21.6, vb0Source: 'table' },
  { city: 'Крива Паланка', sk: 1.5, vb0: 20.1, vb0Source: 'table' },
  { city: 'Струмица', sk: 1.0, vb0: 19, vb0Source: 'map' },
  { city: 'Берово', sk: 1.0, vb0: 14.7, vb0Source: 'table' },
  { city: 'Лазарополе', sk: 2.0, vb0: 23.8, vb0Source: 'table' },
  { city: 'Претор', sk: 1.5, vb0: 20, vb0Source: 'map' },
  { city: 'Пожар', sk: 2.0, vb0: 25, vb0Source: 'map' },
  { city: 'Виница', sk: 1.0, vb0: 17, vb0Source: 'map' },
  { city: 'Тополчани', sk: 1.5, vb0: 21, vb0Source: 'map' },
  { city: 'Маврово', sk: 2.5, vb0: 26, vb0Source: 'map' },
  { city: 'Полог', sk: 2.0, vb0: 20, vb0Source: 'map' },
  { city: 'Попова Шапка', sk: 3.0, vb0: 27, vb0Source: 'map' },
  { city: 'Ѓуриште', sk: 1.5, vb0: 24, vb0Source: 'map' },
]

/* ────────────────────────────────────────────────────────────────
   UI LAYER
   ──────────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'predim', label: '01 / Предимензионирање' },
  { id: 'material', label: '02 / Проценка на Материјал' },
  { id: 'climate', label: '03 / EN 1991 Клима' },
  { id: 'urban', label: '04 / Урбанистичка Изводливост' },
]

const inputCls =
  'w-full border border-ink bg-card px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-accent'
const labelCls =
  'font-heading mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60'

function OutputRow({ k, v, blurred = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-3 last:border-b-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/60">{k}</span>
      <span className={`font-mono text-base font-bold text-ink ${blurred ? 'select-none blur-[5px]' : ''}`}>
        {v}
      </span>
    </div>
  )
}

function Disclaimer() {
  return (
    <p className="mt-8 border-t border-ink/15 pt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink/50">
      Disclaimer: Preliminary values only. Not a valid structural calculation.
    </p>
  )
}

const SPAN_NOTE_TEXT = {
  longer: '// Овој систем се мери по подолгиот распон на полето.',
  shorter: '// За двонасочно носечки плочи, секогаш се усвојува пократкиот распон.',
}

function RCPredim() {
  const [elementKind, setElementKind] = useState('slab')
  const [systemId, setSystemId] = useState('simple')
  const [stressLevel, setStressLevel] = useState('high')
  const [span, setSpan] = useState('6')

  const availableSystems = Object.entries(RC_SYSTEMS).filter(([, s]) => s.appliesTo.includes(elementKind))

  const handleKindChange = (kind) => {
    setElementKind(kind)
    if (!RC_SYSTEMS[systemId].appliesTo.includes(kind)) setSystemId('simple')
  }

  const result = calcPredimension(elementKind, systemId, stressLevel, parseFloat(span))
  const system = RC_SYSTEMS[systemId]

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-6">
        <div>
          <label htmlFor="ek" className={labelCls}>
            Тип на елемент
          </label>
          <select id="ek" value={elementKind} onChange={(e) => handleKindChange(e.target.value)} className={inputCls}>
            {Object.entries(ELEMENT_KINDS).map(([k, r]) => (
              <option key={k} value={k}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sys" className={labelCls}>
            Структурен систем
          </label>
          <select id="sys" value={systemId} onChange={(e) => setSystemId(e.target.value)} className={inputCls}>
            {availableSystems.map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stress" className={labelCls}>
            Ниво на напрегнатост на бетонот
          </label>
          <select id="stress" value={stressLevel} onChange={(e) => setStressLevel(e.target.value)} className={inputCls}>
            <option value="high">Силно напрегнат (ρ = 1.5%) - конзервативно</option>
            <option value="low">Слабо напрегнат (ρ = 0.5%)</option>
          </select>
        </div>
        <div>
          <label htmlFor="span" className={labelCls}>
            Распон L (m)
          </label>
          <input
            id="span"
            type="number"
            min="1"
            max="30"
            step="0.1"
            value={span}
            onChange={(e) => setSpan(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="border border-ink bg-paper/40 p-6">
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          Излез / Output
        </p>
        {result ? (
          <div className="mt-4">
            <OutputRow k={`Мин. ${result.unit}`} v={`${result.mm} mm`} />
            <OutputRow k="Применет однос" v={`L/${result.ratio}`} />
            <OutputRow k="Опсег (EC2, Табела 7.4N)" v={`L/${result.highLd} - L/${result.lowLd}`} />
          </div>
        ) : (
          <p className="mt-4 font-mono text-sm text-ink/50">// Внесете распон помеѓу 1 и 30 m</p>
        )}
        {system.spanNote && (
          <p className="mt-4 font-mono text-[10px] leading-relaxed text-ink/50">{SPAN_NOTE_TEXT[system.spanNote]}</p>
        )}
        <p className="mt-6 border-t border-ink/15 pt-4 font-mono text-[10px] leading-relaxed text-ink/50">
          // Референтни вредности според EN 1992-1-1 (EC2). Граничните
          <br />
          // соодноси се конзервативно поставени; подетална компјутерска
          <br />
          // проверка на угибите најчесто овозможува потенки пресеци.
        </p>
      </div>
    </div>
  )
}

function SteelCompositePredim() {
  const [floorSystem, setFloorSystem] = useState('composite_deck')
  const [span, setSpan] = useState('3')
  const check = checkFloorSpan(floorSystem, parseFloat(span))
  const sys = FLOOR_SYSTEMS[floorSystem]

  return (
    <div className="space-y-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label htmlFor="fs" className={labelCls}>
              Тип на плоча (Flooring)
            </label>
            <select id="fs" value={floorSystem} onChange={(e) => setFloorSystem(e.target.value)} className={inputCls}>
              {Object.entries(FLOOR_SYSTEMS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fspan" className={labelCls}>
              Распон (m)
            </label>
            <input
              id="fspan"
              type="number"
              min="0.5"
              max="20"
              step="0.1"
              value={span}
              onChange={(e) => setSpan(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="border border-ink bg-paper/40 p-6">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Излез / Output
          </p>
          {check ? (
            <div className="mt-4">
              <OutputRow k="Типична вкупна дебелина" v={sys.depthLabel} />
              <OutputRow k="Препорачан економски распон" v={`${sys.spanMin} до ${sys.spanMax} m`} />
              <OutputRow
                k="Внесен распон"
                v={check.inRange ? '✓ Во стандарден опсег' : '⚠ Надвор од типичен опсег'}
              />
            </div>
          ) : (
            <p className="mt-4 font-mono text-sm text-ink/50">// Внесете валиден распон</p>
          )}
          {sys.note && <p className="mt-4 font-mono text-[10px] leading-relaxed text-ink/50">// {sys.note}</p>}
          <p className="mt-6 border-t border-ink/15 pt-4 font-mono text-[10px] leading-relaxed text-ink/50">
            // EN 1993 / EN 1994 наведуваат опсези, не формула - оваа алатка
            <br />
            // го прикажува документираниот опсег, не пресметува конкретна
            <br />
            // вредност за внесениот распон.
          </p>
        </div>
      </div>

      <div className="border border-ink bg-paper/40 p-6">
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          Вообичаен распон на челични греди (Beams)
        </p>
        <div className="mt-4">
          {STEEL_BEAM_SPANS.map((b) => (
            <OutputRow key={b.label} k={b.label} v={b.range} />
          ))}
        </div>
        <p className="mt-6 border-t border-ink/15 pt-4 font-mono text-[10px] leading-relaxed text-ink/50">
          // Практично правило за стабилност: секундарна греда како врска за
          <br />
          // хоризонтална стабилност треба да има крутост h_sec ≥ 0.25 × h_main.
        </p>
      </div>
    </div>
  )
}

function PredimTab() {
  const [material, setMaterial] = useState('rc')

  return (
    <div>
      <div className="mb-8">
        <label htmlFor="material" className={labelCls}>
          Материјал / Систем
        </label>
        <select
          id="material"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          className={`${inputCls} max-w-sm`}
        >
          <option value="rc">Армирано-бетонски конструкции (EN 1992-1-1)</option>
          <option value="steel">Челични / Спрегнати конструкции (EN 1993 / EN 1994)</option>
        </select>
      </div>
      {material === 'rc' ? <RCPredim /> : <SteelCompositePredim />}
    </div>
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzdllory'

function MaterialTab() {
  const [area, setArea] = useState('400')
  const [floors, setFloors] = useState('5')
  const [purpose, setPurpose] = useState('lowrise_residential')
  const [email, setEmail] = useState('')
  const emailValid = EMAIL_RE.test(email)
  const result = calcMaterialEstimate(parseFloat(area), parseInt(floors, 10), purpose)

  const [submitState, setSubmitState] = useState('idle') // idle | sending | sent | error

  const handleSubmit = async () => {
    if (!emailValid || submitState === 'sending') return
    setSubmitState('sending')
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          subject: 'Целосна техничка проценка - барање',
          'Бруто површина': `${area} m2/кат`,
          Катови: floors,
          Намена: PURPOSE_FACTORS[purpose].label,
        }),
      })
      setSubmitState(res.ok ? 'sent' : 'error')
    } catch {
      setSubmitState('error')
    }
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-6">
        <div>
          <label htmlFor="ga" className={labelCls}>
            Бруто површина по кат (m²)
          </label>
          <input id="ga" type="number" min="10" step="10" value={area} onChange={(e) => setArea(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fl" className={labelCls}>
            Број на катови
          </label>
          <input id="fl" type="number" min="1" max="40" step="1" value={floors} onChange={(e) => setFloors(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="pu" className={labelCls}>
            Тип на објект / ниво
          </label>
          <select id="pu" value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputCls}>
            {Object.entries(PURPOSE_FACTORS).map(([k, f]) => (
              <option key={k} value={k}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="border border-ink bg-paper/40 p-6">
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          Излез / Output
        </p>
        {result ? (
          <div className="mt-4">
            <OutputRow k="Вкупна бруто површина" v={`${result.totalArea.toLocaleString('en-US')} m²`} />
            <OutputRow k="Бетон (норматив)" v={`${result.concretePerM2.toFixed(2)} m³/m²`} />
            <OutputRow k="Арматура (норматив)" v={`${result.rebarPerM3} kg/m³`} blurred={submitState !== 'sent'} />
            <OutputRow
              k="Бетон - надземје"
              v={`≈ ${result.superstructureConcreteM3.toLocaleString('en-US')} m³`}
              blurred={submitState !== 'sent'}
            />
            <OutputRow
              k={`Темели (${result.buriedLevels} × ${FOUNDATION_M3_PER_LEVEL} m³/m²)`}
              v={`≈ ${result.foundationConcreteM3.toLocaleString('en-US')} m³`}
              blurred={submitState !== 'sent'}
            />
            <OutputRow k="Вкупно бетон" v={`≈ ${result.concreteM3.toLocaleString('en-US')} m³`} blurred={submitState !== 'sent'} />
            <OutputRow k="Вкупно арматура" v={`≈ ${result.rebarTons} t`} blurred={submitState !== 'sent'} />
          </div>
        ) : (
          <p className="mt-4 font-mono text-sm text-ink/50">// Внесете валидна површина и катови</p>
        )}
        <div className="mt-6 border-t-2 border-accent pt-5">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-ink">
            Отклучи целосна техничка проценка
          </p>
          {submitState === 'sent' ? (
            <p className="mt-3 border border-green-700 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              Испратено! Ќе ве контактираме наскоро на {email}.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="vasiot@email.mk"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (submitState === 'error') setSubmitState('idle')
                }}
                className={inputCls}
                aria-label="Е-пошта за целосна проценка"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!emailValid || submitState === 'sending'}
                className={`font-heading shrink-0 px-5 py-2.5 text-center text-xs font-bold uppercase tracking-[0.12em] ${
                  emailValid && submitState !== 'sending'
                    ? 'bg-accent text-white hover:bg-ink'
                    : 'cursor-not-allowed bg-ink/20 text-ink/50'
                }`}
              >
                {submitState === 'sending' ? 'Испраќање...' : 'Отклучи'}
              </button>
            </div>
          )}
          {submitState === 'error' && (
            <p className="mt-2 text-xs font-medium text-red-700">
              Настана грешка. Обидете се повторно или контактирајте нè директно на info@statera.mk.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ClimateTab() {
  const [cityIdx, setCityIdx] = useState(0)
  const d = CLIMATE_DATA[cityIdx]

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <label htmlFor="city" className={labelCls}>
          Локација / Град
        </label>
        <select id="city" value={cityIdx} onChange={(e) => setCityIdx(Number(e.target.value))} className={inputCls}>
          {CLIMATE_DATA.map((c, i) => (
            <option key={c.city} value={i}>
              {c.city}
            </option>
          ))}
        </select>
        <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink/50">
          // Снежен товар sk е читан од официјалната МКС EN 1991-1-3
          <br />
          // снежна карта (појаси од 0.5 kN/m²) - прикажан како горна
          <br />
          // граница на појасот (≤), приближно ±0.25. Брзината на ветер
          <br />
          // vb,0 е точна табеларна за 9 станици; за другите 11 приближно
          <br />
          // читана од изотахна карта - означено со „~", не табела.
        </p>
      </div>
      <div className="border border-ink bg-paper/40 p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Излез / Output - {d.city}
          </p>
          <span
            className={`font-mono shrink-0 border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
              d.vb0Source === 'table'
                ? 'border-ink/30 bg-paper text-ink/60'
                : 'border-orange-600 bg-orange-50 text-orange-700'
            }`}
          >
            {d.vb0Source === 'table' ? 'sk: Карта · vb0: Табела' : 'sk + vb0: Карта'}
          </span>
        </div>
        <div className="mt-4">
          <OutputRow
            k={
              <>
                Снежен товар s<sub>k</sub>
              </>
            }
            v={`≤ ${d.sk.toFixed(1)} kN/m²`}
          />
          <OutputRow
            k={
              <>
                Брзина на ветер v<sub>b,0</sub>
              </>
            }
            v={
              d.vb0 === null
                ? 'Н/Д'
                : d.vb0Source === 'table'
                  ? `${d.vb0.toFixed(1)} m/s`
                  : `~${d.vb0} m/s (од карта)`
            }
          />
        </div>
        {d.vb0Source === 'map' && (
          <p className="mt-4 font-mono text-[10px] leading-relaxed text-orange-700">
            // Приближна вредност читана од картата според локацијата на
            <br />
            // станицата, не официјална табеларна вредност за оваа станица.
          </p>
        )}
      </div>
    </div>
  )
}

function UrbanPlanningTab() {
  const [plotArea, setPlotArea] = useState('500')
  const [kf, setKf] = useState('0.4')
  const [kpi, setKpi] = useState('1.2')
  const [greenPct, setGreenPct] = useState('')
  const [parkingRatio, setParkingRatio] = useState('')

  const result = calcUrbanFeasibility(
    parseFloat(plotArea),
    parseFloat(kf),
    parseFloat(kpi),
    parseFloat(greenPct),
    parseFloat(parkingRatio)
  )

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-6">
        <div>
          <label htmlFor="plot" className={labelCls}>
            Плоштина на парцела (m²)
          </label>
          <input
            id="plot"
            type="number"
            min="1"
            step="1"
            value={plotArea}
            onChange={(e) => setPlotArea(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="kf" className={labelCls}>
            Kf — коефициент на изградба (0–1)
          </label>
          <input
            id="kf"
            type="number"
            min="0.01"
            max="1"
            step="0.01"
            value={kf}
            onChange={(e) => setKf(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="kpi" className={labelCls}>
            Kpi — коефициент на искористеност
          </label>
          <input
            id="kpi"
            type="number"
            min="0.01"
            step="0.01"
            value={kpi}
            onChange={(e) => setKpi(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="green" className={labelCls}>
            Барано озеленување % (опционално)
          </label>
          <input
            id="green"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="—"
            value={greenPct}
            onChange={(e) => setGreenPct(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="parking" className={labelCls}>
            Паркинг норма — места на 100m² БГП (опционално)
          </label>
          <input
            id="parking"
            type="number"
            min="0"
            step="0.1"
            placeholder="—"
            value={parkingRatio}
            onChange={(e) => setParkingRatio(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="border border-ink bg-paper/40 p-6">
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          Излез / Output
        </p>
        {result ? (
          <div className="mt-4">
            <OutputRow k="Макс. застроена површина" v={`${result.footprint.toLocaleString('en-US', { maximumFractionDigits: 1 })} m²`} />
            <OutputRow k="Макс. бруто градена површина" v={`${result.maxGFA.toLocaleString('en-US', { maximumFractionDigits: 1 })} m²`} />
            <OutputRow k="Просечна спратност" v={`${result.avgFloors.toFixed(1)} ката`} />
            {result.greenAreaRequired !== null && (
              <OutputRow k="Потребна зелена површина" v={`${result.greenAreaRequired.toLocaleString('en-US', { maximumFractionDigits: 1 })} m²`} />
            )}
            {result.parkingSpaces !== null && (
              <OutputRow k="Потребен паркинг" v={`${result.parkingSpaces} места`} />
            )}
          </div>
        ) : (
          <p className="mt-4 font-mono text-sm text-ink/50">
            // Внесете плоштина {'>'}0, Kf помеѓу 0 и 1, и Kpi {'>'}0
          </p>
        )}
        <p className="mt-6 border-t border-ink/15 pt-4 font-mono text-[10px] leading-relaxed text-ink/50">
          // Kf и Kpi не се вградени во алатката — внесете ги од Вашиот
          <br />
          // важечки Извод од ДУП/ГУП за конкретната парцела. Паркинг
          <br />
          // нормата е груба проценка, не заменува проверка на локалната
          <br />
          // регулатива.
        </p>
      </div>
    </div>
  )
}

export default function EngineeringTerminal() {
  const [active, setActive] = useState('predim')

  return (
    <section id="terminal" className="border-y border-ink/10 bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Инженерски Терминал
          </p>
          <h2 className="font-heading mt-2 text-3xl font-bold text-ink md:text-4xl">
            Прелиминарни пресметки, веднаш
          </h2>
          <div className="mt-4 h-[2px] w-16 bg-accent" />
        </div>

        <div className="border border-ink bg-card">
          {/* Tab bar */}
          <div className="flex flex-col border-b border-ink sm:flex-row" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={active === t.id}
                onClick={() => setActive(t.id)}
                className={`font-mono border-b border-ink/15 px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] sm:border-b-0 sm:border-r sm:border-r-ink/15 last:border-b-0 sm:last:border-r-0 ${
                  active === t.id ? 'bg-ink text-white' : 'bg-card text-ink/60 hover:text-accent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="p-6 md:p-10">
            {active === 'predim' && <PredimTab />}
            {active === 'material' && <MaterialTab />}
            {active === 'climate' && <ClimateTab />}
            {active === 'urban' && <UrbanPlanningTab />}
            <Disclaimer />
          </div>
        </div>
      </div>
    </section>
  )
}
