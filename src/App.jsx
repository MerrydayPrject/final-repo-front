import { useState, useEffect } from 'react'
import Header from './components/Header'
import VideoBackground from './components/VideoBackground'
import DomeGallery from './components/DomeGallery'
import DressCollection from './components/DressCollection'
import AboutUs from './components/AboutUs'
import NextSection from './components/NextSection'
import ScrollToTop from './components/ScrollToTop'
import Modal from './components/Modal'
import GeneralFitting from './pages/GeneralFitting'
import CustomFitting from './pages/CustomFitting'
import BodyAnalysis from './pages/BodyAnalysis'
import BodyCorrection from './pages/BodyCorrection'
import './styles/App.css'

function App() {
    const [currentPage, setCurrentPage] = useState('main') // 'main', 'general', 'custom', 'analysis', 'correction'

    // 모달 상태
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMessage, setModalMessage] = useState('')

    // 보정 페이지로 전달할 이미지
    const [correctionImage, setCorrectionImage] = useState(null)

    // 일반피팅 페이지로 전달할 카테고리
    const [selectedCategoryForFitting, setSelectedCategoryForFitting] = useState(null)

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
            setSelectedCategoryForFitting(null) // 메뉴에서 직접 이동 시 카테고리 초기화
        } else if (menuType === 'custom') {
            setCurrentPage('custom')
        } else if (menuType === 'analysis') {
            setCurrentPage('analysis')
        } else if (menuType === 'correction') {
            setCurrentPage('correction')
        }
    }

    // 카테고리 선택하여 일반피팅으로 이동
    const handleNavigateToFittingWithCategory = (category) => {
        setSelectedCategoryForFitting(category)
        setCurrentPage('general')
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
                    <AboutUs
                        onNavigateToGeneral={() => handleMenuClick('general')}
                        onNavigateToCustom={() => handleMenuClick('custom')}
                        onNavigateToAnalysis={() => handleMenuClick('analysis')}
                    />
                    <section className="dome-gallery-section">
                        <div className="dome-gallery-header">
                            <h2 className="dome-gallery-title">다양한 드레스를 피팅해보세요</h2>
                        </div>
                        <DomeGallery />
                    </section>
                    <DressCollection />
                    <NextSection />
                </>
            )}
            <Header
                currentPage={currentPage}
                onBackToMain={currentPage !== 'main' ? handleBackToMain : null}
                onMenuClick={handleMenuClick}
                onLogoClick={handleLogoClick}
            />
            <ScrollToTop />

            {currentPage === 'general' && (
                <GeneralFitting
                    onBackToMain={handleBackToMain}
                    onNavigateToCorrection={(image) => {
                        setCorrectionImage(image)
                        setCurrentPage('correction')
                    }}
                    initialCategory={selectedCategoryForFitting}
                    onCategorySet={() => setSelectedCategoryForFitting(null)}
                />
            )}
            {currentPage === 'custom' && (
                <CustomFitting
                    onBackToMain={handleBackToMain}
                    onNavigateToCorrection={(image) => {
                        setCorrectionImage(image)
                        setCurrentPage('correction')
                    }}
                />
            )}
            {currentPage === 'analysis' && (
                <BodyAnalysis
                    onBackToMain={handleBackToMain}
                    onNavigateToFittingWithCategory={handleNavigateToFittingWithCategory}
                />
            )}
            {currentPage === 'correction' && (
                <BodyCorrection
                    onBackToMain={handleBackToMain}
                    initialImage={correctionImage}
                />
            )}

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

