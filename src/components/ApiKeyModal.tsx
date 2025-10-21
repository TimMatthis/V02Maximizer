import { useEffect, useState } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (key: string, remember: boolean) => void
}

export default function ApiKeyModal({ isOpen, onClose, onSave }: Props) {
  const [key, setKey] = useState('')
  const [remember, setRemember] = useState(true)

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('vo2_openai_key') || ''
        if (saved) setKey(saved)
      } catch {}
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Enter OpenAI API Key</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-3">Your key is used only from your browser to call OpenAI. You can optionally remember it on this device. Do not share keys for public demos.</p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm"
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember on this device (localStorage)
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border hover:bg-gray-50 text-sm">Cancel</button>
          <button
            onClick={() => onSave(key.trim(), remember)}
            disabled={!key.trim()}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >Use Key</button>
        </div>
      </div>
    </div>
  )
}

