import { useState, useEffect } from 'react'
import Header from './components/Header'
import VideoBackground from './components/VideoBackground'
import AboutUs from './components/AboutUs'
import NextSection from './components/NextSection'
import ScrollToTop from './components/ScrollToTop'
import Modal from './components/Modal'
import GeneralFitting from './pages/GeneralFitting'
import CustomFitting from './pages/CustomFitting'
import './styles/App.css'

function App() {
    const [currentPage, setCurrentPage] = useState('main') // 'main', 'general', 'custom'

    // 모달 상태
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMessage, setModalMessage] = useState('')

    // 새로고침 시 스크롤을 최상단으로 이동
    useEffect(() => {
        window.scrollTo(0, 0)
        // 페이지 로드 시 스크롤 위치 복원 방지
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }
    }, [])

    const handleNavigateToFitting = () => {
        setCurrentPage('general')
    }

    const handleBackToMain = () => {
        setCurrentPage('main')
        // 메인 페이지로 스크롤
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const handleLogoClick = () => {
        if (currentPage !== 'main') {
            handleBackToMain()
        } else {
            // 메인 페이지로 스크롤
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    }

    const handleMenuClick = (menuType) => {
        if (menuType === 'general') {
            setCurrentPage('general')
        } else if (menuType === 'custom') {
            setCurrentPage('custom')
        } else if (menuType === 'ai') {
            // AI 체형 피팅 기능은 추후 구현
            openModal('AI 체형 피팅 기능은 준비 중입니다.')
        }
    }

    // 모달 열기
    const openModal = (message) => {
        setModalMessage(message)
        setModalOpen(true)
    }

    // 모달 닫기
    const closeModal = () => {
        setModalOpen(false)
    }

    return (
        <div className="app">
            {currentPage === 'main' && (
                <>
                    <VideoBackground onNavigateToFitting={handleNavigateToFitting} />
                    <AboutUs />
                    <NextSection />
                    <ScrollToTop />
                </>
            )}
            <Header
                currentPage={currentPage}
                onBackToMain={currentPage !== 'main' ? handleBackToMain : null}
                onMenuClick={handleMenuClick}
                onLogoClick={handleLogoClick}
            />

            {currentPage === 'general' && <GeneralFitting onBackToMain={handleBackToMain} />}
            {currentPage === 'custom' && <CustomFitting onBackToMain={handleBackToMain} />}

            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                message={modalMessage}
                center
            />
        </div>
    )
}

export default App

