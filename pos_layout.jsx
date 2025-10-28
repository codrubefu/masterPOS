import React, { useMemo, useState } from 'react'

export default function POSLayout() {
  // --- Settings ---
  const [useNativeKeyboard, setUseNativeKeyboard] = useState(false)

  // --- Form state ---
  const [upc, setUpc] = useState('0')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState('')
  const [name, setName] = useState('')
  const [discPct, setDiscPct] = useState('0')
  const [discVal, setDiscVal] = useState('0')

  // --- Data state ---
  const [items, setItems] = useState([])

  // --- Client state ---
  const [clientLastName, setClientLastName] = useState('Persoana fizica')
  const [clientFirstName, setClientFirstName] = useState('1')

  // --- Price Check (Modal) ---
  const [priceCheckOpen, setPriceCheckOpen] = useState(false)
  const [priceCheckCode, setPriceCheckCode] = useState('')
  const [priceCheckResult, setPriceCheckResult] = useState(null)

  // --- On-screen keyboard state (shared) ---
  const [kb, setKb] = useState({ visible: false, field: null, type: 'decimal', value: '' })
  const [kbShift, setKbShift] = useState(false)

  // --- UI helpers ---
  const handleClick = (label) => console.log(`${label} button clicked`)

  // --- Styles ---
  const btn = 'rounded-2xl h-14 px-4 text-base font-semibold shadow-sm focus:outline-none focus:ring-4 transition active:scale-[0.99]'
  const btnPrimary = `${btn} bg-blue-600 text-white`
  const btnSoft = `${btn} bg-gray-100`
  const btnSuccess = `${btn} bg-green-600 text-white`
  const btnWarning = `${btn} bg-yellow-500 text-white`
  const btnMuted = `${btn} bg-gray-700 text-white`
  const smDanger = 'rounded-xl h-12 px-4 text-sm font-semibold bg-red-600 text-white shadow-sm active:scale-[0.99]'
  const input = 'h-12 w-full rounded-xl border border-gray-300 px-3 text-base shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200'

  // --- Keyboard control ---
  const closeKb = () => setKb({ visible: false, field: null, type: 'decimal', value: '' })
  const openKb = (field, type, initial) => {
    if (useNativeKeyboard) return // use OS keyboard instead
    setKb({ visible: true, field, type, value: String(initial ?? '') })
    setKbShift(false)
  }
  const pressKey = (k) => {
    if (k === 'CLR') return setKb((s) => ({ ...s, value: '' }))
    if (k === 'BK') return setKb((s) => ({ ...s, value: s.value.slice(0, -1) }))
    if (k === '.') {
      if (kb.type !== 'decimal' || kb.value.includes('.')) return
      return setKb((s) => ({ ...s, value: s.value + '.' }))
    }
    setKb((s) => ({ ...s, value: s.value + String(k) }))
  }
  const pressText = (ch) => setKb((s) => ({ ...s, value: s.value + (kbShift ? String(ch).toUpperCase() : String(ch)) }))
  const applyKb = () => {
    const setters = {
      upc: setUpc,
      qty: setQty,
      price: setPrice,
      discPct: setDiscPct,
      discVal: setDiscVal,
      name: setName,
      clientLastName: setClientLastName,
      clientFirstName: setClientFirstName,
      checkCode: setPriceCheckCode, // for modal input
    }
    if (kb.field && setters[kb.field]) setters[kb.field](kb.value)
    closeKb()
  }

  // --- Actions ---
  const addItem = () => {
    const p = parseFloat(price || '0')
    const q = parseFloat(qty || '1')
    const dp = Math.max(0, parseFloat(discPct || '0')) / 100
    const dv = Math.max(0, parseFloat(discVal || '0'))
    const unitAfterAll = Math.max(0, p * (1 - dp) - dv)
    const item = {
      id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
      upc,
      name: name || `Articol ${items.length + 1}`,
      qty: Number.isFinite(q) && q > 0 ? q : 1,
      price: Number.isFinite(p) && p >= 0 ? p : 0,
      discountPct: dp * 100,
      discountVal: dv,
      unitAfterAll,
    }
    console.log('Adauga produs', item)
    setItems((prev) => [...prev, item])
    // optional reset
    setUpc('0'); setQty('1'); setPrice(''); setName(''); setDiscPct('0'); setDiscVal('0')
  }
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id))

  // --- Computed ---
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.qty * it.unitAfterAll, 0), [items])

  // --- Price Check logic ---
  const runPriceCheck = () => {
    const code = String(priceCheckCode || '').trim()
    if (!code) { setPriceCheckResult({ error: 'Introduceți un cod valid.' }); return }
    const found = items.find((i) => String(i.upc) === code)
    if (found) {
      setPriceCheckResult({
        upc: found.upc,
        name: found.name,
        price: found.price,
        qty: found.qty,
        discountPct: Number(found.discountPct) || 0,
        discountVal: Number(found.discountVal) || 0,
        finalUnit: found.unitAfterAll,
      })
    } else {
      setPriceCheckResult({ message: 'Produs negăsit în lista curentă', upc: code })
    }
  }

  // --- Keyboard rows ---
  const row1 = ['q','w','e','r','t','y','u','i','o','p']
  const row2 = ['a','s','d','f','g','h','j','k','l']
  const row3 = ['z','x','c','v','b','n','m']
  const rowRO = ['ă','î','â','ș','ț']

  // --- Shared keyboard overlay, can be used globally and inside modals ---
  const KeyboardPopup = () => (
    !useNativeKeyboard && kb.visible && (
      <div className="fixed inset-0 z-[60] flex items-end md:items-center md:justify-center bg-black/40" onClick={closeKb}>
        <div className="w-full md:w-[720px] bg-white rounded-t-2xl md:rounded-2xl p-5 pb-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Introduceți valoare</div>
            <button className="text-gray-500" onClick={closeKb}>✕</button>
          </div>
          <input className="w-full h-16 rounded-2xl border px-4 text-3xl mb-3" value={kb.value} readOnly />

          {kb.type === 'text' ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-10 gap-3">
                {row1.map((ch) => (
                  <button key={ch} className="h-20 rounded-2xl bg-gray-100 text-2xl font-semibold active:scale-95" onClick={() => pressText(ch)}>
                    {kbShift ? ch.toUpperCase() : ch}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-9 gap-3">
                {row2.map((ch) => (
                  <button key={ch} className="h-20 rounded-2xl bg-gray-100 text-2xl font-semibold active:scale-95" onClick={() => pressText(ch)}>
                    {kbShift ? ch.toUpperCase() : ch}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-9 gap-3">
                <button className="h-20 rounded-2xl bg-gray-200 text-2xl font-semibold" onClick={() => setKbShift((s) => !s)}>⇧</button>
                {row3.map((ch) => (
                  <button key={ch} className="h-20 rounded-2xl bg-gray-100 text-2xl font-semibold active:scale-95" onClick={() => pressText(ch)}>
                    {kbShift ? ch.toUpperCase() : ch}
                  </button>
                ))}
                <button className="h-20 rounded-2xl bg-gray-100 text-2xl font-semibold" onClick={() => setKb((s) => ({ ...s, value: s.value.slice(0, -1) }))}>⌫</button>
              </div>
              <div className="grid grid-cols-8 gap-3">
                {rowRO.map((ch) => (
                  <button key={ch} className="h-20 rounded-2xl bg-gray-100 text-2xl font-semibold active:scale-95" onClick={() => pressText(ch)}>{ch}</button>
                ))}
                <button className="h-20 rounded-2xl bg-gray-100 text-2xl font-semibold col-span-6" onClick={() => pressText(' ')}>Spațiu</button>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <button className="h-16 rounded-2xl bg-gray-200 font-semibold" onClick={() => setKb((s)=>({ ...s, value: '' }))}>Șterge tot</button>
                <button className="h-16 rounded-2xl bg-blue-600 text-white font-semibold" onClick={applyKb}>OK</button>
                <button className="h-16 rounded-2xl bg-gray-700 text-white font-semibold" onClick={closeKb}>Anulează</button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7,8,9].map((n) => (
                  <button key={n} className="h-20 rounded-2xl bg-gray-100 text-3xl font-semibold active:scale-95" onClick={() => pressKey(n)}>{n}</button>
                ))}
                {kb.type === 'decimal' ? (
                  <button className="h-20 rounded-2xl bg-gray-100 text-3xl font-semibold active:scale-95" onClick={() => pressKey('.')}>.</button>
                ) : (
                  <button className="h-20 rounded-2xl bg-gray-50" disabled></button>
                )}
                <button className="h-20 rounded-2xl bg-gray-100 text-3xl font-semibold active:scale-95" onClick={() => pressKey(0)}>0</button>
                <button className="h-20 rounded-2xl bg-gray-100 text-2xl font-semibold active:scale-95" onClick={() => pressKey('BK')}>⌫</button>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <button className="h-16 rounded-2xl bg-gray-200 font-semibold" onClick={() => pressKey('CLR')}>Șterge tot</button>
                <button className="h-16 rounded-2xl bg-blue-600 text-white font-semibold" onClick={applyKb}>OK</button>
                <button className="h-16 rounded-2xl bg-gray-700 text-white font-semibold" onClick={closeKb}>Anulează</button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  )

  return (
    <div className="flex flex-col w-full h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">BON FISCAL</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={useNativeKeyboard} onChange={(e) => setUseNativeKeyboard(e.target.checked)} className="w-5 h-5" />
            Folosește tastatura nativă
          </label>
          <button onClick={() => setPriceCheckOpen(true)} className={btnPrimary}>Verifica Pret</button>
          <div className="text-right">
            <div className="text-xs text-gray-500">Subtotal</div>
            <div className="text-2xl font-bold tabular-nums">{subtotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col xl:flex-row gap-4 h-full overflow-hidden">
        {/* Left column */}
        <div className="xl:w-1/2 w-full bg-white shadow rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Client */}
          <div className="border p-4 rounded-2xl">
            <h2 className="font-semibold mb-3 text-lg">Client</h2>
            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="text-gray-700">Nume</label>
              <input className={input} value={clientLastName} readOnly={!useNativeKeyboard} onFocus={() => openKb('clientLastName','text',clientLastName)} onChange={(e)=>useNativeKeyboard && setClientLastName(e.target.value)} />
              <label className="text-gray-700">Prenume</label>
              <input className={input} value={clientFirstName} readOnly={!useNativeKeyboard} onFocus={() => openKb('clientFirstName','text',clientFirstName)} onChange={(e)=>useNativeKeyboard && setClientFirstName(e.target.value)} />
              <label className="text-gray-700">Reducere%</label>
              <input className={input} inputMode="decimal" value={discPct} readOnly={!useNativeKeyboard} onFocus={() => openKb('discPct','decimal',discPct)} onChange={(e)=>useNativeKeyboard && setDiscPct(e.target.value)} />
            </div>
          </div>

          {/* Bon fiscal line */}
          <div className="border p-4 rounded-2xl">
            <h2 className="font-semibold mb-3 text-lg">Linie Bon Casa Fiscala</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-gray-700">UPC</label>
              <input className={input} inputMode="numeric" value={upc} readOnly={!useNativeKeyboard} onFocus={() => openKb('upc','integer',upc)} onChange={(e)=>useNativeKeyboard && setUpc(e.target.value)} />
              <label className="text-gray-700">Cantitate</label>
              <input className={input} inputMode="numeric" value={qty} readOnly={!useNativeKeyboard} onFocus={() => openKb('qty','integer',qty)} onChange={(e)=>useNativeKeyboard && setQty(e.target.value)} />
              <label className="text-gray-700">Pret</label>
              <input className={input} inputMode="decimal" value={price} readOnly={!useNativeKeyboard} onFocus={() => openKb('price','decimal',price)} onChange={(e)=>useNativeKeyboard && setPrice(e.target.value)} />
              <label className="text-gray-700">Denumire</label>
              <input className={`${input} col-span-2`} value={name} readOnly={!useNativeKeyboard} onFocus={() => openKb('name','text',name)} onChange={(e)=>useNativeKeyboard && setName(e.target.value)} />
              <label className="text-gray-700">Reducere%</label>
              <input className={input} inputMode="decimal" value={discPct} readOnly={!useNativeKeyboard} onFocus={() => openKb('discPct','decimal',discPct)} onChange={(e)=>useNativeKeyboard && setDiscPct(e.target.value)} />
              <label className="text-gray-700">Reducere Valorica</label>
              <input className={input} inputMode="decimal" value={discVal} readOnly={!useNativeKeyboard} onFocus={() => openKb('discVal','decimal',discVal)} onChange={(e)=>useNativeKeyboard && setDiscVal(e.target.value)} />

              <div className="col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                <button onClick={addItem} className={btnSuccess}>Adauga produs</button>
                <button onClick={() => handleClick('Subtotal')} className={btnSoft}>Subtotal</button>
                <button onClick={() => handleClick('Storno P. Cantarit')} className={btnSoft}>Storno P. Cantarit</button>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="border p-4 rounded-2xl grid grid-cols-2 gap-3">
            <label className="text-gray-700">Bani</label>
            <input className={input} inputMode="decimal" readOnly={!useNativeKeyboard} onFocus={() => openKb('price','decimal','')} />
            <label className="text-gray-700">Rest</label>
            <input className={input} defaultValue="0" inputMode="decimal" readOnly={!useNativeKeyboard} onFocus={() => openKb('price','decimal','0')} />
            <label className="text-gray-700">Card</label>
            <input className={input} defaultValue="0" readOnly={!useNativeKeyboard} onFocus={() => openKb('discVal','decimal','0')} />
            <label className="text-gray-700">Numerar</label>
            <input className={input} defaultValue="0" readOnly={!useNativeKeyboard} onFocus={() => openKb('discVal','decimal','0')} />

            <div className="col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <button onClick={() => handleClick('Plata Numerar')} className={btnSuccess}>Plata Numerar</button>
              <button onClick={() => handleClick('Plata Card')} className={`${btnPrimary} bg-purple-600`}>Plata Card</button>
              <button onClick={() => handleClick('Plata Mixta')} className={btnWarning}>Plata Mixta</button>
              <button onClick={() => handleClick('Plata Moderna')} className={btnMuted}>Plata Moderna</button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="xl:w-1/2 w-full bg-white shadow rounded-2xl p-4 flex flex-col overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-left border mb-4">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3">Articol</th>
                  <th className="p-3">Cant</th>
                  <th className="p-3">Pret</th>
                  <th className="p-3">-%</th>
                  <th className="p-3">Valoare</th>
                  <th className="p-3 text-right">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-10">Niciun produs adăugat</td>
                  </tr>
                ) : (
                  items.map((it) => {
                    const lineTotal = it.qty * it.unitAfterAll
                    return (
                      <tr key={it.id} className="border-t">
                        <td className="p-3">{it.name}</td>
                        <td className="p-3 tabular-nums">{it.qty}</td>
                        <td className="p-3 tabular-nums">{it.price.toFixed(2)}</td>
                        <td className="p-3 tabular-nums">{Number(it.discountPct).toFixed(0)}</td>
                        <td className="p-3 tabular-nums font-semibold">{lineTotal.toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => removeItem(it.id)} className={smDanger}>Sterge</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sticky action bar */}
          <div className="mt-auto sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur p-3 rounded-2xl border-t flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleClick('Anulare Bon Deschis Casa')} className={btnSoft}>Anulare Bon Deschis Casa</button>
              <button onClick={() => handleClick('Bon Ambalaje')} className={btnWarning}>Bon Ambalaje</button>
            </div>
            <button onClick={() => handleClick('IESIRE')} className={btnMuted}>IESIRE</button>
          </div>
        </div>
      </div>

      {/* Price check modal */}
      {priceCheckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPriceCheckOpen(false)}>
          <div className="w-full max-w-xl bg-white rounded-2xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Verifică preț</h3>
              <button className="text-gray-500" onClick={() => setPriceCheckOpen(false)}>✕</button>
            </div>
            <label className="block text-sm text-gray-600 mb-1">Cod produs (UPC)</label>
            <div className="flex gap-2 mb-3">
              <input className={input} value={priceCheckCode} inputMode="numeric" readOnly={!useNativeKeyboard} onFocus={() => openKb('checkCode','integer',priceCheckCode)} onChange={(e)=>useNativeKeyboard && setPriceCheckCode(e.target.value)} />
              <button onClick={runPriceCheck} className={btnPrimary}>Caută</button>
            </div>
            {priceCheckResult && (
              <div className="rounded-xl border p-4 bg-gray-50">
                {priceCheckResult.error && <p className="text-red-600">{priceCheckResult.error}</p>}
                {priceCheckResult.message && <p className="text-gray-700 mb-2">{priceCheckResult.message}</p>}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Cod</div><div className="font-medium">{priceCheckResult.upc}</div>
                  <div className="text-gray-500">Denumire</div><div className="font-medium">{priceCheckResult.name}</div>
                  {priceCheckResult.price !== undefined && (
                    <>
                      <div className="text-gray-500">Preț listă</div><div className="font-medium">{Number(priceCheckResult.price).toFixed(2)}</div>
                      <div className="text-gray-500">Reducere %</div><div className="font-medium">{Number(priceCheckResult.discountPct||0).toFixed(0)}%</div>
                      <div className="text-gray-500">Reducere val.</div><div className="font-medium">{Number(priceCheckResult.discountVal||0).toFixed(2)}</div>
                      <div className="text-gray-500">Preț final/unit</div><div className="font-semibold">{Number(priceCheckResult.finalUnit||0).toFixed(2)}</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Keyboard appears inside the same overlay when an input is focused */}
          <KeyboardPopup />
        </div>
      )}

      {/* Global keyboard overlay (for main screen inputs) */}
      <KeyboardPopup />
    </div>
  )
}
