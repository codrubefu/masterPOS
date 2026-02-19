from pathlib import Path
p = Path('src/components/pos/ClientCard.tsx')
s = p.read_text()
# 1) insert useRoPrefix state after customer const
s = s.replace('  };\n\n  const handleChange', '  };\n\n  // Whether to prepend the "RO" prefix when sending the ID\n  const [useRoPrefix, setUseRoPrefix] = useState(false);\n\n  const handleChange')
# 2) update handleKeyDown to use finalId
s = s.replace(
"  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {\n    if (event.key === 'Enter') {\n      event.preventDefault();\n      \n      // Trigger the search by calling onChange with the search ID\n      if (onChange && searchCardId.trim()) {\n        onChange({ ...customer, id: searchCardId.trim() });\n      }\n      \n      // Close the onscreen keyboard by blurring the input\n      event.currentTarget.blur();\n    }\n  };",
"  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {\n    if (event.key === 'Enter') {\n      event.preventDefault();\n      // Build the final id depending on the RO toggle\n      const finalId = (useRoPrefix ? `RO${searchCardId.trim()}` : searchCardId.trim());\n\n      // Trigger the search by calling onChange with the search ID\n      if (onChange && finalId) {\n        onChange({ ...customer, id: finalId });\n      }\n\n      // Close the onscreen keyboard by blurring the input\n      event.currentTarget.blur();\n    }\n  };"
)
# 3) strip RO from native input handler
s = s.replace("setSearchCardId(e.target.value);", "// Strip any accidental RO typed into the numeric input and keep only the numeric part\n        const val = e.target.value.replace(/^RO/i, \"\");\n        setSearchCardId(val);")
# 4) replace the CUI input block with a checkbox toggle + input
old = '''        <label className="flex flex-col gap-1">\n          <span className="text-xs uppercase tracking-wide text-gray-500">CUI</span>\n          <input\n            ref={idRef}\n            type="text"\n            inputMode="text"\n            data-keyboard="numeric"\n            value={searchCardId}\n            onChange={(event) => setSearchCardId(event.target.value)}\n            onKeyDown={handleKeyDown}\n            className={inputClassName}\n            placeholder="Caută cui..."\n          />\n        </label>'''
new = '''        <label className="flex flex-col gap-1">\n          <span className="text-xs uppercase tracking-wide text-gray-500">CUI</span>\n          <div className="flex gap-2 items-center">\n            <label className="inline-flex items-center gap-2 text-sm select-none">\n              <input\n                type="checkbox"\n                className="h-5 w-5 rounded border-gray-200"\n                checked={useRoPrefix}\n                onChange={(e) => setUseRoPrefix(e.target.checked)}\n                aria-label="Prefixează cu RO"\n              />\n              <span className="text-sm font-medium">RO</span>\n            </label>\n            <input\n              ref={idRef}\n              type="text"\n              inputMode="text"\n              data-keyboard="numeric"\n              value={searchCardId}\n              onChange={(event) => setSearchCardId(event.target.value.replace(/^RO/i, ""))}\n              onKeyDown={handleKeyDown}\n              className={inputClassName}\n              placeholder="Caută cui..."\n            />\n          </div>\n        </label>'''
if old in s:
    s = s.replace(old, new)
else:
    print('CUI block not found; aborting')
    raise SystemExit(1)

p.write_text(s)
print('Patched', p)
