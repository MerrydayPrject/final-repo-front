import { useState, useEffect } from 'react'
import Header from './components/Header'
import ImageUpload from './components/ImageUpload'
import DressSelection from './components/DressSelection'
import CustomUpload from './components/CustomUpload'
import CustomResult from './components/CustomResult'
import VideoBackground from './components/VideoBackground'
import AboutUs from './components/AboutUs'
import NextSection from './components/NextSection'
import Modal from './components/Modal'
import { autoMatchImage, removeBackground, customMatchImage } from './utils/api'
import './styles/App.css'

function App() {
    const [showFittingPage, setShowFittingPage] = useState(false)
    const [uploadedImage, setUploadedImage] = useState(null)
    const [selectedDress, setSelectedDress] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [generalResultImage, setGeneralResultImage] = useState(null)
    const [activeTab, setActiveTab] = useState('general')

    // 커스텀 탭용 상태
    const [fullBodyImage, setFullBodyImage] = useState(null)
    const [customDressImage, setCustomDressImage] = useState(null)
    const [customResultImage, setCustomResultImage] = useState(null)
    const [isMatching, setIsMatching] = useState(false) // 매칭 처리 중
    const [isRemovingBackground, setIsRemovingBackground] = useState(false) // 배경 제거 중
    const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false) // 배경 제거 여부

    // 모달 상태
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMessage, setModalMessage] = useState('')

    // 이미지 업로드 모달 상태
    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false)
    const [pendingDress, setPendingDress] = useState(null)

    // 새로고침 시 스크롤을 최상단으로 이동
    useEffect(() => {
        window.scrollTo(0, 0)
        // 페이지 로드 시 스크롤 위치 복원 방지
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }
    }, [])

    const handleImageUpload = (image) => {
        setUploadedImage(image)
        setGeneralResultImage(null)
    }

    const handleDressSelect = (dress) => {
        setSelectedDress(dress)
    }

    const handleReset = () => {
        setUploadedImage(null)
        setSelectedDress(null)
        setIsProcessing(false)
        setGeneralResultImage(null)
        setFullBodyImage(null)
        setCustomDressImage(null)
        setCustomResultImage(null)
        setIsMatching(false)
        setIsRemovingBackground(false)
        setIsBackgroundRemoved(false)
    }

    const handleNavigateToFitting = () => {
        setShowFittingPage(true)
        setActiveTab('general')
    }

    const handleBackToMain = () => {
        setShowFittingPage(false)
        setActiveTab('general')
        handleReset()
    }

    const handleMenuClick = (menuType) => {
        if (menuType === 'general' || menuType === 'custom') {
            setShowFittingPage(true)
            setActiveTab(menuType)
        } else if (menuType === 'ai') {
            // AI 체형 피팅 기능은 추후 구현
            openModal('AI 체형 피팅 기능은 준비 중입니다.')
        }
    }

    // 드레스 드롭으로 매칭 실행
    const handleDressDropped = async (dress) => {
        if (!uploadedImage || !dress) return

        setIsProcessing(true)

        try {
            // 백엔드 API 호출
            const result = await autoMatchImage(uploadedImage, dress)

            if (result.success && result.result_image) {
                // 매칭 결과 이미지 설정
                setSelectedDress(dress)
                setGeneralResultImage(result.result_image)
            } else {
                throw new Error(result.message || '매칭에 실패했습니다.')
            }

            setIsProcessing(false)
        } catch (error) {
            console.error('매칭 중 오류 발생:', error)
            setIsProcessing(false)
            const serverMessage = error?.response?.data?.message || error?.response?.data?.error
            const friendly = serverMessage
                || (error?.code === 'ERR_NETWORK' ? '백엔드 서버에 연결할 수 없습니다.' : null)
                || error.message
            openModal(`매칭 중 오류가 발생했습니다: ${friendly}`)
        }
    }

    // 커스텀 탭 핸들러들
    const handleFullBodyUpload = (image) => {
        setFullBodyImage(image)
    }

    const handleCustomDressUpload = (image) => {
        setCustomDressImage(image)
        setIsBackgroundRemoved(false) // 새 이미지 업로드 시 배경 제거 상태 초기화
    }

    const handleRemoveBackground = async () => {
        if (!customDressImage) return

        setIsRemovingBackground(true)

        try {
            // 백엔드 API 호출
            const result = await removeBackground(customDressImage)

            if (result.success && result.image) {
                // 배경이 제거된 이미지로 업데이트
                // Base64 문자열을 File 객체로 변환
                const response = await fetch(result.image)
                const blob = await response.blob()
                const file = new File([blob], 'dress_no_bg.png', { type: 'image/png' })

                setCustomDressImage(file)
                setIsBackgroundRemoved(true) // 배경 제거 완료 표시
                setIsRemovingBackground(false)
                openModal('배경 제거가 완료되었습니다!')
            } else {
                throw new Error(result.message || '배경 제거에 실패했습니다.')
            }
        } catch (error) {
            console.error('배경 제거 중 오류 발생:', error)
            setIsRemovingBackground(false)
            openModal(`배경 제거 중 오류가 발생했습니다: ${error.message}`)
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

    // 이미지 업로드 모달 열기
    const openImageUploadModal = (dress) => {
        setPendingDress(dress)
        setImageUploadModalOpen(true)
    }

    // 이미지 업로드 모달 닫기
    const closeImageUploadModal = () => {
        setImageUploadModalOpen(false)
        setPendingDress(null)
    }

    // 이미지 업로드 후 드레스 매칭 실행
    const handleImageUploadedForDress = (image) => {
        setUploadedImage(image)
        closeImageUploadModal()

        // 이미지 업로드 후 자동으로 드레스 매칭 실행
        if (pendingDress) {
            setTimeout(() => {
                handleDressDropped(pendingDress)
            }, 100)
        }
    }

    // 이미지 업로드 필요 시 호출되는 핸들러 (드레스 드롭 시)
    const handleImageUploadRequired = (dress) => {
        openImageUploadModal(dress)
    }

    // 수동 매칭 버튼 클릭
    const handleManualMatch = () => {
        if (!fullBodyImage) {
            openModal('전신사진을 업로드해주세요')
            return
        }

        if (!customDressImage) {
            openModal('드레스 이미지를 업로드해주세요')
            return
        }

        if (!isBackgroundRemoved) {
            openModal('배경지우기 버튼을 클릭해주세요')
            return
        }

        handleCustomMatch(fullBodyImage, customDressImage)
    }

    const handleCustomMatch = async (fullBody, dress) => {
        setIsMatching(true)

        try {
            // 백엔드 API 호출
            const result = await customMatchImage(fullBody, dress)

            if (result.success && result.result_image) {
                // 매칭 결과 이미지 설정 (Base64 문자열)
                setCustomResultImage(result.result_image)
            } else {
                throw new Error(result.message || '매칭에 실패했습니다.')
            }

            setIsMatching(false)
        } catch (error) {
            console.error('커스텀 매칭 중 오류 발생:', error)
            setIsMatching(false)
            openModal(`매칭 중 오류가 발생했습니다: ${error.message}`)
        }
    }

    return (
        <div className="app">
            {!showFittingPage && (
                <>
                    <VideoBackground onNavigateToFitting={handleNavigateToFitting} />
                    <AboutUs />
                    <NextSection />
                </>
            )}
            <Header onBackToMain={showFittingPage ? handleBackToMain : null} onMenuClick={handleMenuClick} />

            {showFittingPage && (
                <main className="main-content">
                    <div className="fitting-container">
                        <div className="content-wrapper">
                            <div className="left-container">
                                {/* 탭 메뉴 */}
                                <div className="tab-menu-container">
                                    <div className="tab-menu">
                                        <button
                                            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('general')}
                                        >
                                            일반
                                        </button>
                                        <button
                                            className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('custom')}
                                        >
                                            커스텀
                                        </button>
                                    </div>
                                    <p className="tab-guide-text">
                                        {activeTab === 'general'
                                            ? '드래그 한 번으로 웨딩드레스를 자동 피팅해보세요'
                                            : '배경 제거부터 피팅까지, AI가 모두 자동으로 도와드립니다'
                                        }
                                    </p>
                                </div>

                                {activeTab === 'general' ? (
                                    <ImageUpload
                                        onImageUpload={handleImageUpload}
                                        uploadedImage={uploadedImage}
                                        onDressDropped={handleDressDropped}
                                        isProcessing={isProcessing}
                                        canDownload={!isProcessing && !!selectedDress && !!(generalResultImage || uploadedImage)}
                                        resultImage={generalResultImage}
                                        onImageUploadRequired={handleImageUploadRequired}
                                    />
                                ) : (
                                    <CustomUpload
                                        onFullBodyUpload={handleFullBodyUpload}
                                        onDressUpload={handleCustomDressUpload}
                                        onRemoveBackground={handleRemoveBackground}
                                        fullBodyImage={fullBodyImage}
                                        dressImage={customDressImage}
                                        isProcessing={isRemovingBackground}
                                        isBackgroundRemoved={isBackgroundRemoved}
                                    />
                                )}
                            </div>
                            {activeTab === 'general' && (
                                <div className="drag-guide-arrow">
                                    <div className="drag-guide-text">이미지를 드래그 해주세요</div>
                                    <div className="arrow-icon">←</div>
                                </div>
                            )}
                            {activeTab === 'custom' && (
                                <div className="center-button-container">
                                    <button
                                        className="match-button"
                                        onClick={handleManualMatch}
                                        disabled={isMatching}
                                    >
                                        {isMatching ? '매칭 중...' : '매칭하기'}
                                    </button>
                                </div>
                            )}
                            <div className="right-container">
                                {activeTab === 'general' ? (
                                    <DressSelection
                                        onDressSelect={handleDressSelect}
                                        selectedDress={selectedDress}
                                    />
                                ) : (
                                    <CustomResult
                                        resultImage={customResultImage}
                                        isProcessing={isMatching}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                message={modalMessage}
                center
            />

            {/* 이미지 업로드 모달: 문구 + 확인 버튼만 */}
            <Modal
                isOpen={imageUploadModalOpen}
                onClose={closeImageUploadModal}
                message="전신사진을 업로드해 주세요"
                center
            />
        </div>
    )
}

export default App

