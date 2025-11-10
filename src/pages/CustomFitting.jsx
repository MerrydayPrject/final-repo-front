import { useState, useRef, useEffect } from 'react'
import Lottie from 'lottie-react'
import { MdOutlineDownload } from 'react-icons/md'
import Modal from '../components/Modal'
import { removeBackground, customMatchImage, convertTo3D } from '../utils/api'
import '../styles/App.css'
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
    const [show3DView, setShow3DView] = useState(false)
    const [is3DImage, setIs3DImage] = useState(false)
    const [isConverting3D, setIsConverting3D] = useState(false)
    const [imageTransition, setImageTransition] = useState(false)

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

    // Custom Fitting 핸들러
    const handleFullBodyUpload = (image) => {
        setFullBodyImage(image)
    }

    const handleCustomDressUpload = (image) => {
        setCustomDressImage(image)
        setIsBackgroundRemoved(false)
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
            alert(`배경 제거 중 오류가 발생했습니다: ${error.message}`)
        }
    }

    const handleManualMatch = async () => {
        if (!fullBodyImage) {
            alert('전신사진을 업로드해주세요')
            return
        }

        if (!customDressImage) {
            alert('드레스 이미지를 업로드해주세요')
            return
        }

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
                alert(`배경 제거 중 오류가 발생했습니다: ${error.message}`)
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
                setIs3DImage(false) // 새로운 매칭 결과이므로 3D 상태 리셋
            } else {
                throw new Error(result.message || '매칭에 실패했습니다.')
            }
        } catch (error) {
            console.error('커스텀 매칭 중 오류 발생:', error)
            setIsMatching(false)
            alert(`매칭 중 오류가 발생했습니다: ${error.message}`)
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

    // 3D 변환 핸들러
    const handleConvertTo3D = async () => {
        if (!customResultImage) return

        setIsConverting3D(true)
        setImageTransition(true)

        try {
            // 페이드 아웃 애니메이션
            await new Promise(resolve => setTimeout(resolve, 300))

            const result = await convertTo3D(customResultImage)

            if (result.success && result.result_image) {
                // 페이드 인 애니메이션을 위해 약간의 지연
                await new Promise(resolve => setTimeout(resolve, 100))
                setCustomResultImage(result.result_image)
                setIs3DImage(true)
            } else {
                throw new Error(result.message || '3D 변환에 실패했습니다.')
            }
        } catch (error) {
            console.error('3D 변환 중 오류 발생:', error)
            const serverMessage = error?.response?.data?.message || error?.response?.data?.error
            const friendly = serverMessage
                || (error?.code === 'ERR_NETWORK' ? '백엔드 서버에 연결할 수 없습니다.' : null)
                || error.message
            alert(`3D 변환 중 오류가 발생했습니다: ${friendly}`)
        } finally {
            setIsConverting3D(false)
            // 전환 애니메이션 완료 후 상태 리셋
            setTimeout(() => {
                setImageTransition(false)
            }, 500)
        }
    }

    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper custom-wrapper">
                    <div className="general-fitting-header">
                        <h2 className="general-fitting-title">커스텀피팅</h2>
                        <div className="tab-guide-text">
                            배경 제거부터 피팅까지, AI가 모두 자동으로 도와드립니다
                        </div>
                    </div>

                    <div className="custom-content-row">
                        <div className="right-container custom-right">
                            {/* 결과 이미지 영역 */}
                            <div className="custom-result-container">
                                {!customResultImage && !isMatching ? (
                                    <div className="result-placeholder">
                                        <p>매칭 결과가 여기에 표시됩니다</p>
                                    </div>
                                ) : isMatching ? (
                                    <div className="processing-container">
                                        {loadingAnimation && (
                                            <Lottie animationData={loadingAnimation} loop={true} className="spinner-lottie" />
                                        )}
                                        <p className="processing-text">AI 매칭 중...</p>
                                        <p className="processing-subtext">잠시만 기다려주세요</p>
                                    </div>
                                ) : showCheckmark ? (
                                    <div className="processing-container">
                                        <div className="completion-icon">✓</div>
                                        <p className="processing-text">매칭완료</p>
                                    </div>
                                ) : show3DView ? (
                                    <div className="result-3d-viewer">
                                        <div className="result-3d-container">
                                            <div className="result-3d-placeholder">
                                                <p>3D 뷰어</p>
                                                <p className="result-3d-subtext">3D 모델이 여기에 표시됩니다</p>
                                                <button
                                                    className="back-to-2d-button"
                                                    onClick={() => setShow3DView(false)}
                                                >
                                                    ← 2D로 돌아가기
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`result-image-wrapper ${imageTransition ? 'transitioning' : ''}`}>
                                        <img
                                            src={customResultImage}
                                            alt="Matching Result"
                                            className={`result-image ${is3DImage ? 'image-3d' : ''} ${imageTransition ? 'fade-transition' : ''}`}
                                        />
                                        {(isMatching || isConverting3D) && (
                                            <div className="processing-overlay">
                                                {loadingAnimation && (
                                                    <Lottie animationData={loadingAnimation} loop={true} className="spinner-lottie" />
                                                )}
                                                <p className="processing-text">{isConverting3D ? '3D 변환 중...' : 'AI 매칭 중...'}</p>
                                            </div>
                                        )}
                                        <div className="result-buttons-group">
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
                                                        alert('다운로드에 실패했습니다. 다시 시도해주세요.')
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
                                                    ✨ 보정하러 가기
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            className="convert-3d-button-result"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleConvertTo3D()
                                            }}
                                            disabled={!customResultImage || isConverting3D || isMatching}
                                            title="3D로 변환하기"
                                        >
                                            {isConverting3D ? '3D 변환 중...' : is3DImage ? '3D 변환 완료' : '3D로 변환'}
                                        </button>
                                    </div>
                                )}
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
                                className="convert-3d-button"
                                onClick={handleManualMatch}
                                disabled={isMatching || isRemovingBackground}
                            >
                                {isMatching || isRemovingBackground ? (isRemovingBackground ? '배경 제거 중...' : '매칭 중...') : '매칭하기'}
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
        </main>
    )
}

export default CustomFitting
