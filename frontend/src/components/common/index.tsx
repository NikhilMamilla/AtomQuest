import React from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'

// ==========================================
// BUTTON COMPONENT
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-body font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]'
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-emphasis text-primary-on shadow-lg shadow-primary/20 border border-primary/20',
    secondary: 'bg-surface-raised hover:bg-surface-overlay text-text-primary border border-border/50',
    danger: 'bg-danger hover:bg-danger/80 text-text-inverse shadow-lg shadow-danger/20 border border-danger/20',
    success: 'bg-success hover:bg-success/80 text-text-inverse shadow-lg shadow-success/20 border border-success/20',
    outline: 'bg-transparent border border-border hover:border-border-strong text-text-secondary hover:text-text-primary',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-raised bg-transparent border border-transparent',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-current" />
      )}
      {!loading && icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </button>
  )
}

// ==========================================
// INPUT COMPONENT
// ==========================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-body">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl bg-bg border border-border text-text-primary text-sm placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:bg-surface-raised disabled:cursor-not-allowed transition duration-200 font-body ${
            error ? 'border-danger focus:ring-danger/20 focus:border-danger bg-danger-bg/20' : ''
          } ${className}`}
          {...props}
        />
        {hint && <p className="text-[10px] text-text-secondary font-medium pl-1 font-body">{hint}</p>}
        {error && <p className="text-xs text-danger mt-1 font-medium pl-1 font-body">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ==========================================
// TEXTAREA COMPONENT
// ==========================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-body">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={3}
          className={`w-full px-4 py-3 rounded-xl bg-bg border border-border text-text-primary text-sm placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:bg-surface-raised disabled:cursor-not-allowed resize-none transition duration-200 font-body ${
            error ? 'border-danger focus:ring-danger/20 focus:border-danger bg-danger-bg/20' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1 font-medium pl-1 font-body">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ==========================================
// SELECT COMPONENT
// ==========================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string | number; label: string }[]
  placeholder?: string
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-body">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full px-4 py-3 rounded-xl bg-bg border border-border text-text-primary text-sm placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:bg-surface-raised disabled:cursor-not-allowed appearance-none transition duration-200 font-body ${
              error ? 'border-danger focus:ring-danger/20 focus:border-danger bg-danger-bg/20' : ''
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-surface text-text-disabled">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-danger mt-1 font-medium pl-1 font-body">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ==========================================
// BADGE COMPONENT
// ==========================================
interface BadgeProps {
  children?: React.ReactNode
  variant?: 'slate' | 'indigo' | 'amber' | 'emerald' | 'rose'
  status?: string
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant, status, className = '' }) => {
  let activeVariant: 'slate' | 'indigo' | 'amber' | 'emerald' | 'rose' = variant || 'slate'
  
  if (status) {
    const statusMap: Record<string, 'slate' | 'indigo' | 'amber' | 'emerald' | 'rose'> = {
      draft: 'slate',
      submitted: 'indigo',
      pending: 'indigo',
      approved: 'emerald',
      returned: 'rose',
      locked: 'indigo',
    }
    activeVariant = statusMap[status.toLowerCase()] || 'slate'
  }

  const styles = {
    slate: 'bg-surface-raised text-text-secondary border border-border',
    indigo: 'bg-primary-subtle text-primary border border-primary/20',
    amber: 'bg-warning-bg text-warning border border-warning/20',
    emerald: 'bg-success-bg text-success border border-success/20',
    rose: 'bg-danger-bg text-danger border border-danger/20',
  }

  const content = children || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '')

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider font-body backdrop-blur-sm ${styles[activeVariant]} ${className}`}>
      {content}
    </span>
  )
}

// ==========================================
// MODAL COMPONENT
// ==========================================
interface ModalProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  open, 
  onClose, 
  title, 
  children, 
  footer, 
  width = 'max-w-2xl' 
}) => {
  const modalOpen = open ?? isOpen ?? false
  if (!modalOpen) return null

  const widthClass = width.startsWith('max-w-') ? width : 'max-w-2xl'

  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop using standard tailwind color opacity and expanding to override status bar/safe areas */}
      <div 
        className="absolute -inset-[200px] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container using Elevated Overlay Surface */}
      <div className={`w-full ${widthClass} bg-surface-overlay border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold tracking-wide text-text-primary font-heading">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar font-body">
          {children}
        </div>
 
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-surface-raised font-body">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ==========================================
// WEIGHTAGE BAR COMPONENT
// ==========================================
interface WeightageBarProps {
  totalWeightage?: number
  used?: number
  limit?: number
  isEditingWeightage?: number
}

export const WeightageBar: React.FC<WeightageBarProps> = ({
  totalWeightage,
  used,
  limit = 100,
  isEditingWeightage = 0,
}) => {
  const allocation = totalWeightage ?? used ?? 0
  const percentage = Math.min((allocation / limit) * 100, 100)
  
  let barColor = 'from-primary to-accent'
  let textColor = 'text-primary'
  let label = 'Underallocated'

  if (allocation === 100) {
    barColor = 'from-success to-accent'
    textColor = 'text-success animate-pulse font-bold'
    label = 'Perfect Allocation (100%)'
  } else if (allocation > 100) {
    barColor = 'from-danger to-rose-400 animate-bounce'
    textColor = 'text-danger font-bold'
    label = `Exceeded by ${allocation - 100}%`
  } else {
    label = `${100 - allocation}% Remaining`
  }

  return (
    <div className="w-full h-full bg-surface border border-border rounded-2xl p-5 backdrop-blur-md font-body flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Total Weightage Allocation
          </span>
          <span className={`text-sm font-numeric ${textColor}`}>
            {allocation}% / {limit}% ({label})
          </span>
        </div>
        
        {/* Visual Bar Container */}
        <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden relative">
          {/* Safe baseline (100% mark) */}
          <div className="absolute right-0 top-0 bottom-0 border-r border-border z-10 pointer-events-none"></div>
          
          {/* Current Allocation Bar */}
          <div
            className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Live editing overlay if applicable */}
          {isEditingWeightage > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-primary/40 animate-pulse rounded-full"
              style={{
                left: `${Math.min(((allocation - isEditingWeightage) / limit) * 100, 100)}%`,
                width: `${Math.min((isEditingWeightage / limit) * 100, 100)}%`
              }}
            />
          )}
        </div>
      </div>
      
      {/* Legend & hints */}
      <div className="flex justify-between items-center mt-3 text-[10px] text-text-disabled font-medium">
        <span>Min 10% per Goal</span>
        <span>Goal: Exactly 100%</span>
        <span>Max 8 Goals</span>
      </div>
    </div>
  )
}
