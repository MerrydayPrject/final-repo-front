import { useState, useRef, useEffect } from 'react'
import Lottie from 'lottie-react'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import '../../styles/Analysis/BodyTypeFitting.css'
import '../../styles/Analysis/BodyCorrection.css'

const BodyCorrection = ({ onBackToMain, initialImage }) => {
    const [beforeImage, setBeforeImage] = useState(initialImage || null)
    const [afterImage, setAfterImage] = useState(null)
    const [prompt, setPrompt] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [showPromptInput, setShowPromptInput] = useState(true)
    const [loadingAnimation, setLoadingAnimation] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (initialImage) {
            setBeforeImage(initialImage)
        }
    }, [initialImage])

    useEffect(() => {
        // Lottie 애니메이션 로드
        fetch('/Image/One line dress.json')
            .then(response => response.json())
            .then(data => setLoadingAnimation(data))
            .catch(error => console.error('Lottie 로드 실패:', error))
    }, [])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setBeforeImage(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCorrection = async () => {
        if (!beforeImage || !prompt.trim()) {
            alert('이미지와 보정 내용을 입력해주세요.')
            return
        }

        setIsProcessing(true)
        setShowPromptInput(false)

        // TODO: API 연결
        setTimeout(() => {
            // 임시로 원본 이미지를 결과로 표시
            setAfterImage(beforeImage)
            setIsProcessing(false)
        }, 2000)
    }

    const handleReopenPrompt = () => {
        setShowPromptInput(true)
        setAfterImage(null)
    }

    const handleDownload = () => {
        if (afterImage) {
            const link = document.createElement('a')
            link.href = afterImage
            link.download = 'correction_result.png'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const handleRemoveImage = () => {
        setBeforeImage(null)
        setAfterImage(null)
        setPrompt('')
        setShowPromptInput(true)
    }

    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper">
                    <div className="left-container">
                        <div className="general-fitting-header">
                            <h2 className="general-fitting-title">체형 보정</h2>
                            <div className="tab-guide-text-wrapper">
                                <div className="tab-guide-text">
                                    원하는 보정 내용을 입력하면 AI가 자연스럽게 체형을 보정합니다
                                </div>
                                <button className="faq-button">
                                    <HiQuestionMarkCircle />
                                    <div className="tooltip">이미지를 업로드하고 보정 내용을 입력한 후 보정하기 버튼을 눌러주세요</div>
                                </button>
                            </div>
                        </div>

                        <div className="correction-content-layout">
                            {/* 좌측: Before 이미지 */}
                            <div className="correction-section before-section">
                                <h3 className="section-title">Before</h3>
                                <div className="image-container">
                                    {beforeImage ? (
                                        <>
                                            <img src={beforeImage} alt="보정 전" className="correction-image" />
                                            <button className="remove-image-button" onClick={handleRemoveImage}>
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <div
                                            className="empty-image-placeholder"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <img src="/Image/icons8-카메라-80.png" alt="카메라" className="camera-icon" />
                                            <p>이미지를 업로드해주세요</p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* 우측: After 이미지 & 프롬프트 */}
                            <div className="correction-section after-section">
                                <h3 className="section-title">After</h3>
                                <div className="image-container">
                                    {isProcessing ? (
                                        <div className="processing-state">
                                            {loadingAnimation && (
                                                <Lottie animationData={loadingAnimation} loop={true} className="spinner-lottie" />
                                            )}
                                            <p>AI가 보정 중입니다...</p>
                                        </div>
                                    ) : afterImage && !showPromptInput ? (
                                        <>
                                            <img src={afterImage} alt="보정 후" className="correction-image" />
                                            <button className="download-result-button" onClick={handleDownload}>
                                                ⬇ 다운로드
                                            </button>
                                            <button className="reopen-prompt-button" onClick={handleReopenPrompt}>
                                                ✏️ 다시 보정
                                            </button>
                                        </>
                                    ) : (
                                        <div className="prompt-input-container">
                                            <div className="prompt-header">
                                                <label className="prompt-label">
                                                    💬 보정 내용 입력
                                                </label>
                                                <span className="prompt-hint">
                                                    예: "허리를 더 가늘게", "다리를 길게" 등
                                                </span>
                                            </div>
                                            <textarea
                                                className="prompt-input"
                                                placeholder="원하는 보정 내용을 자세히 입력해주세요..."
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                rows={4}
                                            />

                                            {/* 예시 프롬프트 */}
                                            <div className="prompt-examples">
                                                <span className="example-label">빠른 입력:</span>
                                                <button
                                                    className="example-chip"
                                                    onClick={() => setPrompt('허리를 더 가늘게 보정해주세요')}
                                                >
                                                    허리 보정
                                                </button>
                                                <button
                                                    className="example-chip"
                                                    onClick={() => setPrompt('다리를 길고 날씬하게 보정해주세요')}
                                                >
                                                    다리 보정
                                                </button>
                                                <button
                                                    className="example-chip"
                                                    onClick={() => setPrompt('전체적으로 더 날씬하게 보정해주세요')}
                                                >
                                                    전체 보정
                                                </button>
                                            </div>

                                            <button
                                                className={`correction-submit-button ${prompt.trim() ? 'active' : 'inactive'}`}
                                                onClick={(e) => {
                                                    if (isProcessing || !beforeImage || !prompt.trim()) {
                                                        e.preventDefault()
                                                        return
                                                    }
                                                    handleCorrection()
                                                }}
                                                style={{
                                                    background: prompt.trim() ? '#b0ab99' : '#e0e0e0',
                                                    color: prompt.trim() ? 'white' : '#999',
                                                    cursor: prompt.trim() ? 'pointer' : 'default',
                                                    boxShadow: prompt.trim() ? '0 4px 12px rgba(176, 171, 153, 0.3)' : 'none'
                                                }}
                                            >
                                                {isProcessing ? '보정 중...' : '보정하기'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default BodyCorrection
