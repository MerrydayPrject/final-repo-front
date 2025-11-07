import React from 'react'
import '../styles/Header.css'

const Header = ({ onBackToMain, onMenuClick, onLogoClick, currentPage }) => {
    const handleLogoClick = () => {
        if (onLogoClick) {
            onLogoClick()
        } else if (onBackToMain) {
            onBackToMain()
        } else {
            // 메인 페이지로 스크롤
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    }

    return (
        <header className={`header ${currentPage !== 'main' ? 'header-in-menu' : ''}`}>
            <div className="header-content">
                <div className="logo-container">
                    <h1 className="logo-text" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                        Marryday
                    </h1>
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
                        onClick={() => onMenuClick && onMenuClick('analysis')}
                    >
                        체형 분석
                    </button>
                    <button
                        className="menu-item"
                        onClick={() => onMenuClick && onMenuClick('correction')}
                    >
                        체형 보정
                    </button>
                </nav>
            </div>
        </header>
    )
}

export default Header

