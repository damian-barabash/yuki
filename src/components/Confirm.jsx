import { createContext, useCallback, useContext, useState } from 'react'

const ConfirmCtx = createContext(null)

// Promise-based confirm dialog so a stray tap never deletes anything silently.
// const confirm = useConfirm(); if (await confirm({ title, message, danger })) { ... }
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null) // { opts, resolve }

  const confirm = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        setState({ opts, resolve })
      }),
    [],
  )

  const close = (val) => {
    state?.resolve(val)
    setState(null)
  }

  const o = state?.opts || {}

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-scrim show" onClick={() => close(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">{o.emoji || '🐹'}</div>
            <div className="modal-title">{o.title || 'Точно удалить?'}</div>
            {o.message && <div className="modal-msg">{o.message}</div>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => close(false)}>
                {o.cancelText || 'Отмена'}
              </button>
              <button className={`btn ${o.danger === false ? 'btn-primary' : 'btn-danger'}`} onClick={() => close(true)} autoFocus>
                {o.confirmText || 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
