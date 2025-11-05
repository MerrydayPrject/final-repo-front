import React from 'react'
import '../styles/Header.css'

const Header = ({ onBackToMain, onMenuClick }) => {
    return (
        <header className="header">
            <div className="header-content">
                <div className="logo-container">
                    <h1 className="logo-text">Marryday</h1>
                </div>
                <nav className="header-menu">
                    <button
                        className="menu-item"
                        onClick={() => onMenuClick && onMenuClick('general')}
                    >
                        일반피팅
                    </button>
                    <button
                        className="menu-item"
                        onClick={() => onMenuClick && onMenuClick('custom')}
                    >
                        커스텀피팅
                    </button>
                    <button
                        className="menu-item"
                        onClick={() => onMenuClick && onMenuClick('ai')}
                    >
                        AI 체형 피팅
                    </button>
                </nav>
            </div>
        </header>
    )
}

export default Header

