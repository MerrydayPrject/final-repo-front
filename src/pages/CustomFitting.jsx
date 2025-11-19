import { useState, useRef, useEffect } from 'react'
import Lottie from 'lottie-react'
import { MdOutlineDownload } from 'react-icons/md'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import Modal from '../components/Modal'
import { removeBackground, customMatchImage } from '../utils/api'
import '../styles/App.css'
import '../styles/ImageUpload.css'
import '../styles/CustomUpload.css'
import '../styles/CustomResult.css'

const CustomFitting = ({ onBackToMain, onNavigateToCorrection }) => {
    // Custom Fitting 상태
    const [fullBodyImage, setFullBodyImage] = useState(null)
    const [customDressImage, setCustomDressImage] = useState(null)
    const [customResultImage, setCustomResultImage] = useState(null)
    const [isMatching, setIsMatching] = useState(false)
    const [isRemovingBackground, setIsRemovingBackground] = useState(false)
    const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false)
    const [loadingAnimation, setLoadingAnimation] = useState(null)
    const [bgRemovalModalOpen, setBgRemovalModalOpen] = useState(false)
    const [imageTransition, setImageTransition] = useState(false)
    const [errorModalOpen, setErrorModalOpen] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [currentStep, setCurrentStep] = useState(1)

    // 배경 선택 상태
    const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState(0)
    const backgroundImages = [
        '/Image/background4.png',
        '/Image/background1.jpg',
        '/Image/background2 (2).png',
        '/Image/background3.jpg'
    ]
    const backgroundLabels = ['피팅 룸', '야외 홀', '회색 스튜디오', '정원']

    // CustomUpload 상태
    const [fullBodyPreview, setFullBodyPreview] = useState(null)
    const [dressPreview, setDressPreview] = useState(null)
    const [isDraggingFullBody, setIsDraggingFullBody] = useState(false)
    const [isDraggingDress, setIsDraggingDress] = useState(false)
    const fullBodyInputRef = useRef(null)
    const dressInputRef = useRef(null)

    // CustomResult 상태
    const [showCheckmark, setShowCheckmark] = useState(false)
    const prevProcessingRef = useRef(isMatching)

    useEffect(() => {
        // Lottie 애니메이션 로드
        fetch('/Image/One line dress.json')
            .then(response => response.json())
            .then(data => setLoadingAnimation(data))
            .catch(error => console.error('Lottie 로드 실패:', error))
    }, [])

    // 배경 이미지 URL을 File 객체로 변환하는 함수
    const urlToFile = async (url, filename = 'background.jpg') => {
        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const isExternalUrl = url.startsWith('http://') || url.startsWith('https://')
            const proxyUrl = isExternalUrl
                ? `${apiBaseUrl}/api/proxy-image?url=${encodeURIComponent(url)}`
                : url

            const response = await fetch(proxyUrl)
            if (!response.ok) {
                throw new Error(`배경 이미지를 가져올 수 없습니다: ${response.statusText}`)
            }
            const blob = await response.blob()
            return new File([blob], filename, { type: blob.type })
        } catch (error) {
            console.error('배경 이미지 변환 오류:', error)
            throw error
        }
    }

    // 배경 선택 핸들러
    const handleBackgroundSelect = (index) => {
        setSelectedBackgroundIndex(index)
        if (currentStep < 2) {
            setCurrentStep(2)
        }
    }

    // Custom Fitting 핸들러
    const handleFullBodyUpload = (image) => {
        setFullBodyImage(image)
        // 이미지가 변경되면 기존 매칭 결과 초기화 및 STEP 2로 이동
        if (image && customResultImage) {
            setCustomResultImage(null)
            setCurrentStep(2)
        }
    }

    const handleCustomDressUpload = (image) => {
        setCustomDressImage(image)
        setIsBackgroundRemoved(false)
        // 이미지가 변경되면 기존 매칭 결과 초기화 및 STEP 2로 이동
        if (image && customResultImage) {
            setCustomResultImage(null)
            setCurrentStep(2)
        }
    }

    const handleRemoveBackground = async () => {
        if (!customDressImage) return

        setIsRemovingBackground(true)

        try {
            const result = await removeBackground(customDressImage)

            if (result.success && result.image) {
                const response = await fetch(result.image)
                const blob = await response.blob()
                const file = new File([blob], 'dress_no_bg.png', { type: 'image/png' })

                setCustomDressImage(file)
                setIsBackgroundRemoved(true)
                setIsRemovingBackground(false)
                setBgRemovalModalOpen(true)
            } else {
                throw new Error(result.message || '배경 제거에 실패했습니다.')
            }
        } catch (error) {
            console.error('배경 제거 중 오류 발생:', error)
            setIsRemovingBackground(false)
            setErrorMessage(`배경 제거 중 오류가 발생했습니다: ${error.message}`)
            setErrorModalOpen(true)
        }
    }

    const handleManualMatch = async () => {
        if (!fullBodyImage) {
            setErrorMessage('전신사진을 업로드해주세요')
            setErrorModalOpen(true)
            return
        }

        if (!customDressImage) {
            setErrorMessage('드레스 이미지를 업로드해주세요')
            setErrorModalOpen(true)
            return
        }

        // STEP 3로 이동
        setCurrentStep(3)

        // 자동으로 배경 제거 후 매칭
        let dressImageToMatch = customDressImage

        // 배경이 제거되지 않았다면 자동으로 제거
        if (!isBackgroundRemoved) {
            setIsRemovingBackground(true)
            try {
                const result = await removeBackground(customDressImage)

                if (result.success && result.image) {
                    const response = await fetch(result.image)
                    const blob = await response.blob()
                    const file = new File([blob], 'dress_no_bg.png', { type: 'image/png' })

                    dressImageToMatch = file
                    setCustomDressImage(file)
                    setIsBackgroundRemoved(true)
                } else {
                    throw new Error(result.message || '배경 제거에 실패했습니다.')
                }
            } catch (error) {
                console.error('배경 제거 중 오류 발생:', error)
                setIsRemovingBackground(false)
                setErrorMessage(`배경 제거 중 오류가 발생했습니다: ${error.message}`)
                setErrorModalOpen(true)
                return
            } finally {
                setIsRemovingBackground(false)
            }
        }

        // 배경 제거 완료 후 매칭 진행
        handleCustomMatch(fullBodyImage, dressImageToMatch)
    }

    const handleCustomMatch = async (fullBody, dress) => {
        setIsMatching(true)

        try {
            const result = await customMatchImage(fullBody, dress)

            if (result.success && result.result_image) {
                setCustomResultImage(result.result_image)
                setIsMatching(false)
                setCurrentStep(3)
            } else {
                throw new Error(result.message || '매칭에 실패했습니다.')
            }
        } catch (error) {
            console.error('커스텀 매칭 중 오류 발생:', error)
            setIsMatching(false)
            setErrorMessage(`매칭 중 오류가 발생했습니다: ${error.message}`)
            setErrorModalOpen(true)
        }
    }

    // CustomUpload 핸들러
    const handleFullBodyFileChange = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('image/')) {
            handleFullBodyFile(file)
        }
    }

    const handleFullBodyFile = (file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            setFullBodyPreview(reader.result)
            handleFullBodyUpload(file)
        }
        reader.readAsDataURL(file)
    }

    useEffect(() => {
        if (fullBodyImage instanceof File) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFullBodyPreview(reader.result)
            }
            reader.readAsDataURL(fullBodyImage)
        } else if (!fullBodyImage) {
            setFullBodyPreview(null)
        }
    }, [fullBodyImage])

    const handleFullBodyDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingFullBody(true)
    }

    const handleFullBodyDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY

        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDraggingFullBody(false)
        }
    }

    const handleFullBodyDrop = (e) => {
        e.preventDefault()
        setIsDraggingFullBody(false)

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            handleFullBodyFile(file)
        }
    }

    const handleFullBodyClick = () => {
        fullBodyInputRef.current?.click()
    }

    const handleFullBodyRemove = () => {
        setFullBodyPreview(null)
        handleFullBodyUpload(null)
        // 이미지 삭제 시 매칭 결과 초기화 및 STEP 2로 이동
        if (customResultImage) {
            setCustomResultImage(null)
            setCurrentStep(2)
        }
        if (fullBodyInputRef.current) {
            fullBodyInputRef.current.value = ''
        }
    }

    const handleDressFileChange = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('image/')) {
            handleDressFile(file)
        }
    }

    const handleDressFile = (file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            setDressPreview(reader.result)
            handleCustomDressUpload(file)
        }
        reader.readAsDataURL(file)
    }

    useEffect(() => {
        if (customDressImage instanceof File) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setDressPreview(reader.result)
            }
            reader.readAsDataURL(customDressImage)
        } else if (!customDressImage) {
            setDressPreview(null)
        }
    }, [customDressImage])

    const handleDressDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingDress(true)
    }

    const handleDressDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY

        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDraggingDress(false)
        }
    }

    const handleDressDrop = (e) => {
        e.preventDefault()
        setIsDraggingDress(false)

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            handleDressFile(file)
        }
    }

    const handleDressClick = () => {
        dressInputRef.current?.click()
    }

    const handleDressRemove = () => {
        setDressPreview(null)
        handleCustomDressUpload(null)
        // 이미지 삭제 시 매칭 결과 초기화 및 STEP 2로 이동
        if (customResultImage) {
            setCustomResultImage(null)
            setCurrentStep(2)
        }
        if (dressInputRef.current) {
            dressInputRef.current.value = ''
        }
    }

    // CustomResult 매칭 완료 감지
    useEffect(() => {
        if (prevProcessingRef.current && !isMatching && customResultImage) {
            setShowCheckmark(true)
            const timer = setTimeout(() => {
                setShowCheckmark(false)
            }, 1500)
            return () => clearTimeout(timer)
        }
        prevProcessingRef.current = isMatching
    }, [isMatching, customResultImage])

    const renderBackgroundButtons = () => (
        <div className="background-selector step-background-selector">
            {backgroundImages.map((bgImage, index) => (
                <button
                    key={index}
                    className={`background-button ${selectedBackgroundIndex === index ? 'active' : ''}`}
                    onClick={() => handleBackgroundSelect(index)}
                    disabled={isMatching}
                    title={`배경 ${index + 1} 선택`}
                >
                    {bgImage ? (
                        <img src={bgImage} alt={`배경 ${index + 1}`} />
                    ) : (
                        <span className="background-dot"></span>
                    )}
                    {backgroundLabels[index] && (
                        <span className="background-hover-label">{backgroundLabels[index]}</span>
                    )}
                </button>
            ))}
        </div>
    )

    const renderUploadArea = () => {
        // STEP 3에서 결과 이미지 표시
        if (currentStep === 3) {
            if (isMatching) {
                return (
                    <div className="image-upload-wrapper">
                        <div className="preview-container">
                            <div className="processing-overlay">
                                {loadingAnimation && (
                                    <Lottie animationData={loadingAnimation} loop={true} className="spinner-lottie" />
                                )}
                                <p>매칭 중...</p>
                            </div>
                        </div>
                    </div>
                )
            }

            if (showCheckmark) {
                return (
                    <div className="image-upload-wrapper">
                        <div className="preview-container">
                            <div className="processing-overlay">
                                <div className="completion-icon">✓</div>
                                <p>매칭완료</p>
                            </div>
                        </div>
                    </div>
                )
            }

            if (customResultImage) {
                return (
                    <div className="image-upload-wrapper">
                        <div className={`preview-container ${imageTransition ? 'transitioning' : ''}`}>
                            <img
                                src={customResultImage}
                                alt="Matching Result"
                                className={`preview-image ${imageTransition ? 'fade-transition' : ''}`}
                            />
                        </div>
                    </div>
                )
            }

            // STEP 3이지만 결과가 없을 때는 아무것도 표시하지 않음
            return null
        }

        // STEP 2와 STEP 1에서는 이미지 업로드 영역 없음
        return null
    }

    const renderResultActions = () => {
        if (!customResultImage || isMatching) return null

        return (
            <div className="step-result-actions">
                <button
                    className="download-button"
                    onClick={async (e) => {
                        e.stopPropagation()
                        try {
                            if (customResultImage.startsWith('data:')) {
                                const link = document.createElement('a')
                                link.href = customResultImage
                                link.download = 'custom_match_result.png'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                            } else {
                                const response = await fetch(customResultImage)
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = 'custom_match_result.png'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                window.URL.revokeObjectURL(url)
                            }
                        } catch (err) {
                            console.error('다운로드 실패:', err)
                            setErrorMessage('다운로드에 실패했습니다. 다시 시도해주세요.')
                            setErrorModalOpen(true)
                        }
                    }}
                    title="결과 이미지를 다운로드"
                >
                    <MdOutlineDownload /> 다운로드
                </button>
                {onNavigateToCorrection && (
                    <button
                        className="correction-button"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (onNavigateToCorrection) {
                                onNavigateToCorrection(customResultImage)
                            }
                        }}
                        title="체형 보정 페이지로 이동"
                    >
                        <img src="/Image/tuning_icon.png" alt="보정 아이콘" className="tuning-icon" />
                        보정하러 가기
                    </button>
                )}
            </div>
        )
    }

    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <div className="step-guide-panel">
                    <div className="step-badge">STEP 1</div>
                    <h3 className="step-title">피팅 배경을 먼저 선택해보세요</h3>
                    <p className="step-description">아래 배경 버튼을 눌러 웨딩 피팅 공간의 무드를 선택하면 STEP 2로 이동합니다.</p>
                    {renderBackgroundButtons()}
                    <p className="step-tip">배경을 선택하면 자동으로 다음 단계가 열려요.</p>
                </div>
            )
        }

        if (currentStep === 2) {
            return (
                <div className="step-guide-panel step-guide-panel-step2">
                    <div className="step-2-header">
                        <div className="step-badge">STEP 2</div>
                        <div className="step-2-text">
                            <h3 className="step-title">전신사진과 드레스 사진을 업로드하고 매칭하기를 선택해주세요</h3>
                            <p className="step-description">왼쪽 업로드 영역에서 전신사진과 드레스 사진을 업로드한 후 매칭하기 버튼을 누르면 STEP 3로 이동합니다.</p>
                        </div>
                    </div>
                    <div className="step-panel-content">
                        <button type="button" className="step-link-button" onClick={() => setCurrentStep(1)}>
                            STEP 1 · 배경 다시 선택
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="step-guide-panel step-guide-panel-step3">
                <div className="step-3-header">
                    <div className="step-badge">STEP 3</div>
                    <p className="step-3-message">매칭 결과가 표시됩니다</p>
                </div>
                {renderUploadArea()}
                {renderResultActions()}
                <div className="step-actions">
                    <button type="button" onClick={() => setCurrentStep(1)}>
                        STEP 1
                    </button>
                    <button type="button" onClick={() => setCurrentStep(2)}>
                        STEP 2
                    </button>
                </div>
            </div>
        )
    }

    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper custom-wrapper">
                    <div className="general-fitting-header">
                        <h2 className="general-fitting-title">커스텀피팅</h2>
                        <div className="tab-guide-text-wrapper">
                            <div className="tab-guide-text">
                                배경 제거부터 피팅까지, AI가 모두 자동으로 도와드립니다
                            </div>
                            <button className="faq-button">
                                <HiQuestionMarkCircle />
                                <div className="tooltip">전신사진과 드레스 이미지를 업로드한 후 매칭하기 버튼을 눌러주세요</div>
                            </button>
                        </div>
                    </div>

                    <div className="custom-content-row">
                        <div className="right-container custom-right">
                            {/* 결과 이미지 영역 - STEP 구조 */}
                            <div className="image-upload">
                                {renderStepContent()}
                            </div>
                        </div>

                        <div className="left-container custom-left">
                            {/* 사용자 이미지 업로드 영역 */}
                            <div className="custom-upload-card">
                                <input
                                    ref={fullBodyInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFullBodyFileChange}
                                    style={{ display: 'none' }}
                                />

                                {!fullBodyPreview ? (
                                    <div
                                        className={`custom-upload-area ${isDraggingFullBody ? 'dragging' : ''}`}
                                        onDragOver={handleFullBodyDragOver}
                                        onDragLeave={handleFullBodyDragLeave}
                                        onDrop={handleFullBodyDrop}
                                        onClick={handleFullBodyClick}
                                    >
                                        <div className="upload-icon">
                                            <img src="/Image/body_icon.png" alt="전신사진 아이콘" />
                                        </div>
                                        <p className="upload-text">전신사진을 업로드 해주세요</p>
                                    </div>
                                ) : (
                                    <div
                                        className={`custom-preview-container ${isDraggingFullBody ? 'dragging' : ''}`}
                                        onDragOver={handleFullBodyDragOver}
                                        onDragLeave={handleFullBodyDragLeave}
                                        onDrop={handleFullBodyDrop}
                                    >
                                        <img src={fullBodyPreview} alt="Full Body" className="custom-preview-image" />
                                        <button className="custom-remove-button" onClick={handleFullBodyRemove}>
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 드레스 이미지 업로드 영역 */}
                            <div className="custom-upload-card">
                                <input
                                    ref={dressInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleDressFileChange}
                                    style={{ display: 'none' }}
                                />

                                {!dressPreview ? (
                                    <div
                                        className={`custom-upload-area ${isDraggingDress ? 'dragging' : ''}`}
                                        onDragOver={handleDressDragOver}
                                        onDragLeave={handleDressDragLeave}
                                        onDrop={handleDressDrop}
                                        onClick={handleDressClick}
                                    >
                                        <div className="upload-icon">
                                            <img src="/Image/dress_icon.png" alt="드레스 아이콘" />
                                        </div>
                                        <p className="upload-text">드레스 사진을 업로드 해주세요</p>
                                    </div>
                                ) : (
                                    <div
                                        className={`custom-preview-container ${isDraggingDress ? 'dragging' : ''}`}
                                        onDragOver={handleDressDragOver}
                                        onDragLeave={handleDressDragLeave}
                                        onDrop={handleDressDrop}
                                    >
                                        <img src={dressPreview} alt="Dress" className="custom-preview-image" />
                                        <button className="custom-remove-button" onClick={handleDressRemove}>
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 매칭하기 버튼 */}
                            <button
                                className="analyze-button"
                                onClick={handleManualMatch}
                                disabled={isMatching || isRemovingBackground || !fullBodyImage || !customDressImage || !!customResultImage}
                            >
                                {isMatching || isRemovingBackground
                                    ? (isRemovingBackground ? '배경 제거 중...' : '매칭 중...')
                                    : customResultImage
                                        ? '매칭완료'
                                        : '매칭하기'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 배경 제거 완료 모달 */}
            <Modal
                isOpen={bgRemovalModalOpen}
                onClose={() => setBgRemovalModalOpen(false)}
                message="배경 제거가 완료되었습니다"
                center
            />

            {/* 에러 모달 */}
            <Modal
                isOpen={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                message={errorMessage}
                center
            />
        </main>
    )
}

export default CustomFitting
