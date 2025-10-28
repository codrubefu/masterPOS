# masterPOS

Interfață POS realizată cu Vite, React, TypeScript și Tailwind CSS. Include flux complet de bon fiscal: căutare/scanare produse, reduceri, totaluri și metode de plată.

## Comenzi inițiale

```bash
npm create vite@latest pos-ui -- --template react-ts
cd pos-ui
npm i zustand react-router-dom react-hotkeys-hook clsx
npm i -D tailwindcss postcss autoprefixer @types/node vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npx tailwindcss init -p
```

Acest proiect include deja configurațiile rezultate din pașii de mai sus.

## Instalare

```bash
npm install
```

## Rulare în modul dezvoltare

```bash
npm run dev
```

Aplicația este disponibilă implicit la [http://localhost:5173](http://localhost:5173).

## Build de producție

```bash
npm run build
```

## Teste

```bash
npm run test
```

## Structură

```
src/
  app/            # Store Zustand și rutare
  components/     # Componente POS reutilizabile
  features/cart/  # Logică și utilitare coș
  lib/            # Utilitare comune (money, shortcuts)
  mocks/          # Date mock produse și clienți
  pages/          # Pagina POS principală
  styles/         # Stiluri globale Tailwind
```

## Shortcut-uri tastatură

- `F1` focus pe UPC
- `F2` focus pe Cantitate
- `F3` focus pe Preț
- `Enter` adăugare linie
- `Del` șterge linia selectată
- `Ctrl + ↑ / Ctrl + ↓` reordonează liniile
- `F9` plata numerar
- `F10` plata card
- `F11` plata mixtă
- `Esc` ieșire

## Persistență

Starea bonului și a clientului este salvată în `localStorage` pentru a fi rehidratată la reîncărcarea aplicației.
