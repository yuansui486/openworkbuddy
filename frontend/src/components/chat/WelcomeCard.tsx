import React from 'react'
import './WelcomeCard.css'

export default function WelcomeCard() {
  return (
    <div className="welcome-card">
      <div className="welcome-avatar">
        <span className="avatar-letter">A</span>
      </div>
      <h2 className="welcome-title">老板，今天从哪里开始做起？</h2>
      <p className="welcome-hint">输入你的想法，或从下方建议开始</p>
    </div>
  )
}
