import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Header from './components/Header/Header'
import MainPage from './pages/Main/MainPage'
import GeneralFitting from './pages/General/GeneralFitting'
import CustomFitting from './pages/Custom/CustomFitting'
import BodyAnalysis from './pages/Analysis/BodyAnalysis'
import FuturePage from './pages/Future/FuturePage'
import { addPlatformClasses } from './utils/platform'
import './styles/App.css'

function App() {
    const navigate = useNavigate()
    const location = useLocation()

    // 현재 페이지 경로에서 페이지 이름 추출
    const getCurrentPage = () => {
        const path = location.pathname
        if (path === '/') return 'main'
        if (path === '/general') return 'general'
        if (path === '/custom') return 'custom'
        if (path === '/analysis') return 'analysis'
        if (path === '/future') return 'future'
        return 'main'
    }

    const currentPage = getCurrentPage()

    // 일반피팅 페이지로 전달할 카테고리
    const [selectedCategoryForFitting, setSelectedCategoryForFitting] = useState(null)

    // 플랫폼 감지 및 클래스 추가
    useEffect(() => {
        addPlatformClasses()

        // 화면 크기 변경 시에도 플랫폼 클래스 업데이트
        const handleResize = () => {
            addPlatformClasses()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    // 새로고침 시 스크롤을 최상단으로 이동
    useEffect(() => {
        window.scrollTo(0, 0)
        // 페이지 로드 시 스크롤 위치 복원 방지
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }
    }, [])


    const handleNavigateToFitting = () => {
        navigate('/general')
    }

    const handleBackToMain = () => {
        navigate('/')
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
            navigate('/general')
            setSelectedCategoryForFitting(null) // 메뉴에서 직접 이동 시 카테고리 초기화
        } else if (menuType === 'custom') {
            navigate('/custom')
        } else if (menuType === 'analysis') {
            navigate('/analysis')
        } else if (menuType === 'future') {
            navigate('/future')
        }
    }

    // 카테고리 선택하여 일반피팅으로 이동
    const handleNavigateToFittingWithCategory = (category) => {
        setSelectedCategoryForFitting(category)
        navigate('/general')
    }

    return (
        <div className="app">
            <Header
                currentPage={currentPage}
                onBackToMain={currentPage !== 'main' ? handleBackToMain : null}
                onMenuClick={handleMenuClick}
                onLogoClick={handleLogoClick}
            />

            <Routes>
                <Route
                    path="/"
                    element={
                        <MainPage
                            onNavigateToFitting={handleNavigateToFitting}
                            onNavigateToGeneral={() => handleMenuClick('general')}
                            onNavigateToCustom={() => handleMenuClick('custom')}
                            onNavigateToAnalysis={() => handleMenuClick('analysis')}
                        />
                    }
                />
                <Route
                    path="/general"
                    element={
                        <GeneralFitting
                            onBackToMain={handleBackToMain}
                            initialCategory={selectedCategoryForFitting}
                            onCategorySet={() => setSelectedCategoryForFitting(null)}
                        />
                    }
                />
                <Route
                    path="/custom"
                    element={
                        <CustomFitting
                            onBackToMain={handleBackToMain}
                        />
                    }
                />
                <Route
                    path="/analysis"
                    element={
                        <BodyAnalysis
                            onBackToMain={handleBackToMain}
                            onNavigateToFittingWithCategory={handleNavigateToFittingWithCategory}
                        />
                    }
                />
                <Route
                    path="/future"
                    element={
                        <FuturePage
                            key="future-page"
                            onBackToMain={handleBackToMain}
                        />
                    }
                />
            </Routes>
        </div>
    )
}

export default App

