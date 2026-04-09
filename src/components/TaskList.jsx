// Pixel-perfect match with morph transition
//
// Hosts the AddTaskMorph in the empty-state layout from Figma
// (node-id 1695:3536). Heading, subheading, morph button, and footer
// text are stacked with the exact 56px gap from the design.
//
// When the morph enters editing mode, the surrounding copy fades out
// so the textarea reads as a focused input mode — nothing competing
// for attention. Layout slot is preserved (opacity, not display) so
// the textarea doesn't shift position when the text disappears.

import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { BackButton } from './ui/BackButton'
import { AddTaskMorph } from './AddTaskMorph'

const EASE_OUT = [0.4, 0, 0.2, 1]

export function TaskList() {
  const [mode, setMode] = useState('idle')
  const isEditing = mode === 'editing'

  // Shared fade behavior — surrounding copy drifts up slightly while
  // it fades to keep the focus pull subtle but directional.
  const fadeProps = {
    initial: false,
    animate: {
      opacity: isEditing ? 0 : 1,
      y: isEditing ? -6 : 0,
    },
    transition: { duration: 0.28, ease: EASE_OUT },
    style: { pointerEvents: isEditing ? 'none' : 'auto' },
  }

  return (
    <div
      className="min-h-screen bg-[#f5f5f5]"
      style={{ fontFamily: "'Geist Variable', Geist, system-ui, sans-serif" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-12">
        <BackButton />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center" style={{ gap: 56 }}>
            {/* Heading + subheading — fades when editing */}
            <Motion.div
              {...fadeProps}
              className="flex flex-col items-center text-center"
              style={{ ...fadeProps.style, gap: 4 }}
            >
              <h1
                style={{
                  fontFamily: "'Geist Variable', Geist, sans-serif",
                  fontWeight: 600,
                  fontSize: 28,
                  lineHeight: 'normal',
                  color: '#000000',
                }}
              >
                Nothing here yet
              </h1>
              <p
                style={{
                  fontFamily: "'Geist Variable', Geist, sans-serif",
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: 1.5,
                  color: '#5f6268',
                  whiteSpace: 'nowrap',
                }}
              >
                Start by adding your first task to stay organized and productive.
              </p>
            </Motion.div>

            {/* The morphing add-task control */}
            <AddTaskMorph onModeChange={setMode} />

            {/* Footer line — also fades when editing */}
            <Motion.p
              {...fadeProps}
              style={{
                ...fadeProps.style,
                fontFamily: "'Geist Variable', Geist, sans-serif",
                fontWeight: 400,
                fontSize: 17,
                lineHeight: 1.5,
                color: '#5f6268',
                textAlign: 'center',
              }}
            >
              You&rsquo;re all set… for now 👀
            </Motion.p>
          </div>
        </div>
      </div>
    </div>
  )
}
