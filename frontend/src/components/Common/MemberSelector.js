"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { projectMemberAPI } from "../../utils/api"
import "./MemberSelector.css"

/**
 * MemberSelector
 * Props:
 * - projectId: number (required)
 * - value: string | array (member id/username) depending on multiple
 * - onChange: (value) => void
 * - multiple: boolean (default false)
 * - placeholder: string
 * - labelKey: string ('username' or 'name'), defaults to 'username'
 * - valueKey: string ('id' or 'username'), defaults to 'id'
 */
export default function MemberSelector({
  projectId,
  value,
  onChange,
  multiple = false,
  placeholder = "搜索成员...",
  labelKey = "username",
  valueKey = "id",
}) {
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!projectId) return
    let canceled = false
    ;(async () => {
      const res = await projectMemberAPI.members(projectId)
      if (canceled) return
      if (res.ok) {
        setOptions(Array.isArray(res.data) ? res.data : res.data?.list || [])
      } else {
        setOptions([])
      }
    })()
    return () => {
      canceled = true
    }
  }, [projectId])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase()
    return options.filter((m) => (m[labelKey] || "").toLowerCase().includes(q))
  }, [query, options, labelKey])

  const currentValues = useMemo(() => {
    if (multiple) return Array.isArray(value) ? value : []
    return value ?? null
  }, [value, multiple])

  const toggleValue = (val) => {
    if (multiple) {
      const next = Array.isArray(currentValues) ? [...currentValues] : []
      const idx = next.indexOf(val)
      if (idx >= 0) next.splice(idx, 1)
      else next.push(val)
      onChange?.(next)
    } else {
      onChange?.(val)
      setOpen(false)
    }
  }

  const displayLabel = (val) => {
    const found = options.find((m) => m[valueKey] === val)
    return found ? found[labelKey] : String(val)
  }

  return (
    <div className="member-selector" ref={ref}>
      <div className="selector-control">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="dropdown">
          {filtered.map((m) => {
            const val = m[valueKey]
            const label = m[labelKey]
            const selected = multiple
              ? Array.isArray(currentValues) && currentValues.includes(val)
              : currentValues === val
            return (
              <div key={val} className="option" onClick={() => toggleValue(val)}>
                <span>{label}</span>
                {selected ? <span>✓</span> : null}
              </div>
            )
          })}
          {filtered.length === 0 && <div className="option">无匹配成员</div>}
        </div>
      )}

      {multiple ? (
        <div className="chips">
          {Array.isArray(currentValues) &&
            currentValues.map((val) => (
              <div className="chip" key={val}>
                <span>{displayLabel(val)}</span>
                <span className="remove-btn" onClick={() => toggleValue(val)}>
                  ×
                </span>
              </div>
            ))}
        </div>
      ) : currentValues != null ? (
        <div className="chips">
          <div className="chip">
            <span>{displayLabel(currentValues)}</span>
            <span className="remove-btn" onClick={() => onChange?.(null)}>
              ×
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
