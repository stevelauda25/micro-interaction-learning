// Pixel-perfect match with morph transition + premium interaction polish
//
// Empty state ⇆ textarea state, both rebuilt 1:1 from Figma
// (node-id 1695:3536 and 1769:3847). The morph is a single shared shell
// that animates width / height / padding / radius / background, with a
// dark "blob" element that physically shrinks from full pill (240×62)
// down to a 44×44 submit circle in the bottom-right of the textarea.
//
// Interaction states:
//   idle              — pill button, hover ready
//   editing/empty     — placeholder visible, submit DISABLED, no clear
//   editing/typing    — placeholder hidden, submit ENABLED + pulse, X visible
//
// Once typing has started we never revert state on a pause — the system
// stays acknowledged. Clearing is the user's deliberate action, not a side
// effect of going idle.

import { useState, useRef, useEffect, useId } from 'react'
import {
  motion as Motion,
  AnimatePresence,
  useAnimationControls,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
  animate as animateValue,
} from 'framer-motion'
import { Plus, Check, X } from 'lucide-react'

// ── Motion ────────────────────────────────────────────────────────────────
const EASE_OUT = [0.4, 0, 0.2, 1]
const DURATION = 0.4

// ── Figma-exact layout values ─────────────────────────────────────────────
const IDLE_SHELL = {
  width: 240,
  height: 62,
  borderRadius: 99,
  padding: 0,
  backgroundColor: 'rgba(241, 241, 243, 0)',
  borderColor: 'rgba(0, 0, 0, 0)',
}
const EDITING_SHELL = {
  width: 500,
  height: 130,
  borderRadius: 20,
  padding: 4,
  backgroundColor: 'rgba(241, 241, 243, 1)', // #f1f1f3
  borderColor: 'rgba(0, 0, 0, 0.05)',
}

const IDLE_BLOB = { top: 0, left: 0, width: 240, height: 62 }
const EDITING_BLOB = { top: 70, left: 440, width: 44, height: 44 }

const DARK_GRADIENT =
  'radial-gradient(ellipse 60% 110% at 62% 100%, #505050 0%, #3d3d3d 50%, #2a2a2a 100%)'
const BLOB_SHADOW =
  '0px 1.152px 1.152px 0px #ffffff, inset 0px 1.152px 1.152px 0px rgba(0,0,0,0.25)'

// ── Component ─────────────────────────────────────────────────────────────

export function AddTaskMorph({ onModeChange }) {
  const [mode, setMode] = useState('idle') // 'idle' | 'editing'
  const [value, setValue] = useState('') // controlled textarea value
  const [isBlobHover, setIsBlobHover] = useState(false)
  const textareaRef = useRef(null)
  const textareaControls = useAnimationControls() // drives clear-out animation
  const blobScaleControls = useAnimationControls() // drives enable-pulse
  const reduceMotion = useReducedMotion()
  const inputId = useId()

  const isEditing = mode === 'editing'
  const hasContent = value.trim().length > 0
  const blobActive = isEditing && hasContent
  const blobInteractive = !isEditing || hasContent

  // ── Cursor-driven glow ────────────────────────────────────────────────
  // Mouse position is held in motion values so the radial gradient can
  // re-render via CSS without forcing React re-renders on every pixel.
  // Two gradients are layered: a tight hot spot for the bright cursor
  // core, and a wide soft halo for the ambient bloom. Both anchor to the
  // same coordinates so they read as a single light source. Sizes animate
  // between the idle pill and the editing submit-circle scales.
  const glowX = useMotionValue(120)
  const glowY = useMotionValue(31)
  const glowSize = useMotionValue(170)
  const glowCoreSize = useMotionValue(60)

  useEffect(() => {
    animateValue(glowSize, isEditing ? 70 : 170, {
      duration: DURATION,
      ease: EASE_OUT,
    })
    animateValue(glowCoreSize, isEditing ? 26 : 60, {
      duration: DURATION,
      ease: EASE_OUT,
    })
  }, [isEditing, glowSize, glowCoreSize])

  // Halo + hot core, layered. Order matters — the hot core paints last
  // so it sits above the halo and pops where the cursor actually is.
  const glowBackground = useMotionTemplate`
    radial-gradient(${glowCoreSize}px circle at ${glowX}px ${glowY}px, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 65%),
    radial-gradient(${glowSize}px circle at ${glowX}px ${glowY}px, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 72%)
  `

  // Sync glow coords with mouse, in element-local space.
  const updateGlowFromEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    glowX.set(e.clientX - rect.left)
    glowY.set(e.clientY - rect.top)
  }

  const handleBlobMouseMove = updateGlowFromEvent

  // Snap to entry point so the glow doesn't drift in from a stale center.
  const handleBlobMouseEnter = (e) => {
    updateGlowFromEvent(e)
    setIsBlobHover(true)
  }

  // Focus only after the morph has visually committed — focusing during the
  // size tween causes the browser to scroll/jump and breaks the illusion.
  useEffect(() => {
    if (!isEditing) return
    const t = setTimeout(() => textareaRef.current?.focus(), 280)
    return () => clearTimeout(t)
  }, [isEditing])

  // Notify parent on mode change so the surrounding page (heading,
  // subheading, footer) can react — e.g. fade out for focus mode.
  useEffect(() => {
    onModeChange?.(mode)
  }, [mode, onModeChange])

  // Submit button "becoming available" pulse — fires the moment the first
  // valid character is typed. A small physical "click in place" so the
  // user understands the action just unlocked.
  useEffect(() => {
    if (!isEditing || !hasContent || reduceMotion) return
    blobScaleControls.start({
      scale: [1, 1.06, 1],
      transition: { duration: 0.34, ease: EASE_OUT },
    })
  }, [hasContent, isEditing, blobScaleControls, reduceMotion])

  const open = () => {
    if (mode === 'idle') setMode('editing')
  }

  const close = () => {
    setMode('idle')
    setValue('')
  }

  // Check / Confirm button — INTENTIONALLY NON-FUNCTIONAL for now.
  // Even when the textarea has content and the button is "active", the
  // click does nothing: no submit, no reset, no navigate, no clear, no
  // state change. The active visual state is purely an affordance.
  const handleCheckClick = () => {
    // no-op
  }

  // Animated clear: fade text out → reset value → fade ready state in.
  // Without this the placeholder would re-appear instantly while the
  // user's last character is still on screen, which feels jarring.
  const handleClear = async () => {
    if (reduceMotion) {
      setValue('')
      textareaRef.current?.focus()
      return
    }
    await textareaControls.start({
      opacity: 0,
      y: 6,
      transition: { duration: 0.18, ease: EASE_OUT },
    })
    setValue('')
    textareaControls.set({ y: 0 })
    textareaControls.start({
      opacity: 1,
      transition: { duration: 0.22, ease: EASE_OUT },
    })
    textareaRef.current?.focus()
  }

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: DURATION, ease: EASE_OUT }

  return (
    <div
      // Wrapper exists so the ESC hint can sit absolutely below the
      // morphing shell without affecting its layout. Width is FIXED to
      // 500px (the largest morph state) so the horizontal centering
      // anchor never drifts as the shell tweens between 240 and 500.
      // The shell is centered inside via items-center; the hint is
      // anchored to the wrapper's center via left:50% / translateX.
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 500,
      }}
      onKeyDown={(e) => {
        // Global ESC inside the component — works even when focus is on
        // the X button or the submit, not just the textarea.
        if (e.key === 'Escape' && isEditing) {
          e.preventDefault()
          close()
        }
      }}
    >
    <Motion.div
      // ── The morphing shell ────────────────────────────────────────────
      initial={false}
      animate={isEditing ? EDITING_SHELL : IDLE_SHELL}
      transition={transition}
      onClick={!isEditing ? open : undefined}
      onKeyDown={(e) => {
        if (mode === 'idle' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          open()
        }
      }}
      role={!isEditing ? 'button' : undefined}
      aria-label={!isEditing ? 'Add new task' : undefined}
      tabIndex={!isEditing ? 0 : -1}
      style={{
        position: 'relative',
        borderStyle: 'solid',
        borderWidth: 1,
        cursor: isEditing ? 'default' : 'pointer',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Inner textarea card ─────────────────────────────────────── */}
      {/* Inset by 4px in editing so the outer #f1f1f3 frame is visible   */}
      {/* (Figma node 1769:3873 — the inner card sits at 4,4 inside the   */}
      {/* outer wrapper at 492×122, leaving a 4px gray border).            */}
      {/* Subtle hover lift: scale + tighter border + faint inner glow.   */}
      <Motion.div
        initial={false}
        animate={{
          opacity: isEditing ? 1 : 0,
          top: isEditing ? 4 : 0,
          right: isEditing ? 4 : 0,
          bottom: isEditing ? 4 : 0,
          left: isEditing ? 4 : 0,
        }}
        transition={{
          duration: DURATION,
          ease: EASE_OUT,
          opacity: {
            duration: 0.28,
            ease: EASE_OUT,
            delay: isEditing ? 0.12 : 0,
          },
        }}
        whileHover={
          isEditing
            ? {
                scale: 1.006,
                borderColor: 'rgba(0, 0, 0, 0.18)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 6px rgba(0,0,0,0.04)',
              }
            : undefined
        }
        style={{
          position: 'absolute',
          borderRadius: 16,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          padding: 12,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.01) 100%), #eeeeee',
          pointerEvents: isEditing ? 'auto' : 'none',
          overflow: 'hidden',
          boxSizing: 'border-box',
          transformOrigin: 'center',
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          New task
        </label>

        {/* Custom placeholder overlay — native ::placeholder can't be   */}
        {/* tweened cleanly. This one fades + drifts up as the user types.*/}
        <Motion.span
          aria-hidden="true"
          initial={false}
          animate={{
            opacity: hasContent ? 0 : 0.5,
            y: hasContent ? -2 : 0,
          }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            pointerEvents: 'none',
            fontFamily: "'Geist Variable', Geist, sans-serif",
            fontWeight: 600,
            fontSize: 20,
            lineHeight: 1.5,
            color: '#7b7b7b',
            whiteSpace: 'nowrap',
          }}
        >
          What needs to be done?
        </Motion.span>

        {/* Textarea wrapper — clear-out animation runs on this layer    */}
        {/* so we can fade the *user's text* away before resetting state.*/}
        <Motion.div
          initial={false}
          animate={textareaControls}
          style={{
            position: 'relative',
            width: '100%',
            height: 30,
          }}
        >
          <textarea
            id={inputId}
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // ESC closes back to idle. Enter is intentionally NOT
              // bound to the check button — the check button is a no-op,
              // so Enter must not "submit" either. Let Enter insert a
              // newline as a normal textarea would.
              if (e.key === 'Escape') {
                e.preventDefault()
                close()
              }
            }}
            rows={1}
            placeholder=""
            style={{
              display: 'block',
              width: '100%',
              height: 30,
              // Explicit reset of UA defaults — textareas ship with
              // browser-specific padding/margin that pushes the cursor
              // off the placeholder baseline.
              padding: 0,
              paddingRight: 36, // clearance for the X button
              margin: 0,
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: "'Geist Variable', Geist, sans-serif",
              fontWeight: 600,
              fontSize: 20,
              lineHeight: 1.5,
              // Real content color — darker than the placeholder.
              color: '#1a1a1a',
              // Subtle text-opacity ramp — typed content sits at full
              // weight, system feels "locked in".
              opacity: hasContent ? 1 : 0.85,
              transition: 'opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)',
              caretColor: '#1a1a1a',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
              verticalAlign: 'top',
            }}
          />
        </Motion.div>

        {/* ── Clear (X) button ────────────────────────────────────────── */}
        {/* Aligned with the first line of text, NOT centered to the card.*/}
        {/* Fades + scales in only when there is content.                  */}
        <AnimatePresence>
          {hasContent && (
            <Motion.button
              key="clear"
              type="button"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              whileHover={{
                scale: 1.1,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
              }}
              whileTap={{ scale: 0.92 }}
              aria-label="Clear text"
              style={{
                position: 'absolute',
                top: 15, // visually aligned with first line cap-height
                right: 12,
                width: 24,
                height: 24,
                borderRadius: 12,
                border: 'none',
                background: 'rgba(0, 0, 0, 0)',
                color: '#7b7b7b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                zIndex: 2,
              }}
            >
              <X size={14} strokeWidth={2.5} aria-hidden="true" />
            </Motion.button>
          )}
        </AnimatePresence>
      </Motion.div>

      {/* ── Dark blob (button → submit circle) ──────────────────────── */}
      {/* Outer wrapper handles position+size morph; inner wrapper holds  */}
      {/* the visual chrome and the enable-pulse / hover transforms.     */}
      <Motion.div
        initial={false}
        animate={isEditing ? EDITING_BLOB : IDLE_BLOB}
        transition={transition}
        style={{
          position: 'absolute',
          // Always interactive — the blob IS the "Add New Task" button in
          // idle and the submit circle in editing. Without pointerEvents
          // here the cursor-follow glow handlers below never fire.
          pointerEvents: 'auto',
        }}
      >
        <Motion.div
          initial={false}
          animate={blobScaleControls}
          onClick={(e) => {
            e.stopPropagation()
            // Idle: this dark pill IS the "+ Add New Task" button →
            //   open the textarea editor.
            // Editing: this is the Check / Confirm circle → DO NOTHING.
            //   No submit, no reset, no navigate, no clear, no state
            //   change. Visual affordance only.
            if (!isEditing) {
              open()
            } else {
              handleCheckClick()
            }
          }}
          onMouseMove={handleBlobMouseMove}
          onMouseEnter={handleBlobMouseEnter}
          onMouseLeave={() => setIsBlobHover(false)}
          whileHover={blobActive ? { scale: 1.04 } : undefined}
          whileTap={blobActive ? { scale: 0.94 } : undefined}
          role={isEditing ? 'button' : undefined}
          aria-label={isEditing ? 'Confirm task' : undefined}
          aria-disabled={isEditing && !hasContent}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 99,
            borderStyle: 'solid',
            borderWidth: 1.824,
            borderColor: '#8f8f8f',
            background: DARK_GRADIENT,
            boxShadow: BLOB_SHADOW,
            overflow: 'hidden',
            boxSizing: 'border-box',
            transformOrigin: 'center',
            cursor: !isEditing
              ? 'inherit'
              : hasContent
                ? 'pointer'
                : 'not-allowed',
            // Disabled visual state — dim the whole submit when invalid
            opacity: isEditing && !hasContent ? 0.45 : 1,
            transition: 'opacity 240ms cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
          }}
        >
          {/* ── Cursor-following radial glow ─────────────────────────── */}
          {/* A motion.div whose background is a CSS radial gradient    */}
          {/* anchored to live mouse coordinates. mix-blend-mode: screen */}
          {/* lightens the dark gradient underneath instead of layering   */}
          {/* a flat white film. Hidden when the button is disabled.    */}
          <Motion.div
            aria-hidden="true"
            initial={false}
            animate={{
              opacity: isBlobHover && blobInteractive ? 1 : 0,
            }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: glowBackground,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              willChange: 'background',
            }}
          />
          {/* "+ Add New Task" — visible in idle */}
          <Motion.div
            initial={false}
            animate={{ opacity: isEditing ? 0 : 1, y: isEditing ? -8 : 0 }}
            transition={{
              duration: 0.18,
              ease: EASE_OUT,
              delay: isEditing ? 0 : 0.18,
            }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <Plus size={24} strokeWidth={2} aria-hidden="true" />
            <span
              style={{
                fontFamily: "'Geist Variable', Geist, sans-serif",
                fontWeight: 500,
                fontSize: 20,
                lineHeight: 1.5,
                textShadow: '0px 2.583px 3.874px rgba(0,0,0,0.05)',
              }}
            >
              Add New Task
            </span>
          </Motion.div>

          {/* Check icon — visible in editing */}
          <Motion.div
            initial={false}
            animate={{ opacity: isEditing ? 1 : 0, y: isEditing ? 0 : 8 }}
            transition={{
              duration: 0.2,
              ease: EASE_OUT,
              delay: isEditing ? 0.22 : 0,
            }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              pointerEvents: 'none',
            }}
          >
            <Check size={22} strokeWidth={2.5} aria-hidden="true" />
          </Motion.div>
        </Motion.div>
      </Motion.div>
    </Motion.div>

    {/* ── ESC hint pill ──────────────────────────────────────────────── */}
    {/* From Figma node 1785:4876 — sits 27px below the textarea bottom, */}
    {/* horizontally centered. Fades in after the morph commits, fades   */}
    {/* out before it as the shell collapses back.                        */}
    <AnimatePresence>
      {isEditing && (
        <Motion.div
          key="esc-hint"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{
            duration: 0.24,
            ease: EASE_OUT,
            delay: 0.18,
          }}
          aria-hidden="true"
          // CRITICAL: this is informational only — pointerEvents disables
          // ALL clicks on the hint and its children, so the "Close" label
          // is purely visual. No onClick, no navigation, no state change.
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: 27,
            // translate3d (instead of translateX) forces a sub-pixel
            // snap on the GPU layer, eliminating any half-pixel drift
            // during the morph.
            left: '50%',
            transform: 'translate3d(-50%, 0, 0)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Key cap — 49×43, paddingTop 16, paddingBottom 12, px 12.    */}
          {/* Pure system font stack — no icon font, no Inter dependency. */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 16,
              paddingBottom: 12,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 8,
              background: '#fbfbfb',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow:
                '0 2px 0 0 #c8c8c8, inset 0 1px 0 0 #ffffff, inset 0 -1.591px 0 0 rgba(0,0,0,0.04)',
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontFeatureSettings: '"liga" 0, "calt" 0',
              fontWeight: 700,
              fontSize: 12,
              lineHeight: 1,
              color: '#000000',
              textTransform: 'uppercase',
            }}
          >
            esc
          </span>
          {/* "Close" — plain readable text, separated from the key cap   */}
          {/* by 16px gap, no icon component, no font ligatures.          */}
          <span
            style={{
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontFeatureSettings: '"liga" 0, "calt" 0',
              fontWeight: 500,
              fontSize: 18,
              lineHeight: 1.5,
              color: '#000000',
            }}
          >
            Close
          </span>
        </Motion.div>
      )}
    </AnimatePresence>
    </div>
  )
}
