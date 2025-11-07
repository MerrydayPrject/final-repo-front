import { useState, useRef, useEffect } from 'react'
import '../styles/BodyTypeFitting.css'
import { analyzeImage, getDresses } from '../utils/api'

const BodyAnalysis = ({ onBackToMain }) => {
    const [uploadedImage, setUploadedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [allDresses, setAllDresses] = useState([])
    const [filteredDresses, setFilteredDresses] = useState([])
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const fileInputRef = useRef(null)

    // 드레스 목록 로드
    useEffect(() => {
        loadDresses()
    }, [])

    const loadDresses = async () => {
        try {
            const response = await getDresses()
            if (response.success && response.dresses) {
                setAllDresses(response.dresses)
            }
        } catch (error) {
            console.error('드레스 목록 로드 오류:', error)
        }
    }

    // 파일 선택 핸들러
    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            setUploadedImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
            // 이전 분석 결과 초기화
            setAnalysisResult(null)
        }
    }

    // 업로드 박스 클릭 핸들러
    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    // 분석하기 버튼 핸들러
    const handleAnalyze = async () => {
        if (!uploadedImage) {
            alert('먼저 이미지를 업로드해주세요!')
            return
        }

        setIsAnalyzing(true)
        try {
            const result = await analyzeImage(uploadedImage)
            setAnalysisResult(result)

            // 분석 결과의 카테고리에 맞는 드레스 필터링
            if (result && result.category) {
                const category = result.category.toLowerCase().trim()
                const filtered = allDresses.filter(dress => {
                    const dressCategory = (dress.category || dress.dress_category || '').toLowerCase().trim()
                    return dressCategory === category || dressCategory.includes(category)
                })
                setFilteredDresses(filtered)
                setCurrentSlideIndex(0) // 슬라이더 위치 초기화
            } else {
                // 카테고리 정보가 없으면 전체 드레스 표시
                setFilteredDresses(allDresses)
            }
        } catch (error) {
            console.error('분석 오류:', error)
            alert('이미지 분석 중 오류가 발생했습니다.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // 슬라이더 이동 핸들러
    const handlePrevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1)
        }
    }

    const handleNextSlide = () => {
        if (currentSlideIndex < filteredDresses.length - 5) {
            setCurrentSlideIndex(currentSlideIndex + 1)
        }
    }

    // 표시할 드레스 개수 계산
    const visibleDressCount = Math.min(5, filteredDresses.length)

    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper">
                    <div className="left-container">
                        <div className="general-fitting-header">
                            <h2 className="general-fitting-title">체형 분석</h2>
                            <div className="tab-guide-text">
                                AI가 당신의 체형을 자동으로 분석하고 최적의 드레스를 추천해드립니다
                            </div>
                        </div>

                        {/* 상단 영역: 좌측 업로드, 우측 분석결과 */}
                        <div className="analysis-main-section">
                            {/* 좌측: 이미지 업로드 영역 */}
                            <div className="upload-area">
                                <div className="image-container">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="업로드된 이미지" className="correction-image" />
                                            <button className="remove-image-button" onClick={(e) => {
                                                e.stopPropagation()
                                                setUploadedImage(null)
                                                setImagePreview(null)
                                                setAnalysisResult(null)
                                            }}>
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <div
                                            className="empty-image-placeholder"
                                            onClick={handleUploadClick}
                                        >
                                            <img src="/Image/icons8-카메라-80.png" alt="카메라" className="camera-icon" />
                                            <p>이미지를 업로드해주세요</p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* 우측: 분석 결과 영역 */}
                            <div className="analysis-result-area">
                                <div className="result-box">
                                    {!analysisResult ? (
                                        <div className="result-placeholder">
                                            <p className="placeholder-text">
                                                이미지를 업로드하고<br />
                                                분석하기 버튼을 눌러주세요
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="result-content">
                                            <div className="result-item">
                                                <strong>체형 유형:</strong> {analysisResult.body_type || '분석 중...'}
                                            </div>
                                            <div className="result-item">
                                                <strong>추천 카테고리:</strong> {analysisResult.category || '전체'}
                                            </div>
                                            <div className="result-item">
                                                <strong>분석 내용:</strong>
                                                <p className="analysis-description">
                                                    {analysisResult.message || analysisResult.description || '체형 분석이 완료되었습니다.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="analyze-button"
                                    onClick={handleAnalyze}
                                    disabled={!uploadedImage || isAnalyzing}
                                >
                                    {isAnalyzing ? '분석 중...' : '분석하기'}
                                </button>
                            </div>
                        </div>

                        {/* 하단: 드레스 슬라이더 */}
                        <div className="dress-slider-section">
                            <div className="slider-header">
                                <h3 className="section-title">
                                    {analysisResult && analysisResult.category
                                        ? `추천 드레스 - ${analysisResult.category}`
                                        : '추천 드레스'}
                                </h3>
                                {analysisResult && filteredDresses.length > 0 && (
                                    <p className="dress-count">총 {filteredDresses.length}개</p>
                                )}
                            </div>

                            {!analysisResult ? (
                                <div className="slider-placeholder">
                                    <p className="slider-placeholder-text">
                                        체형 분석 후 맞춤형 드레스를 추천해드립니다
                                    </p>
                                </div>
                            ) : filteredDresses.length === 0 ? (
                                <div className="slider-placeholder">
                                    <p className="slider-placeholder-text">
                                        해당 카테고리의 드레스가 없습니다
                                    </p>
                                </div>
                            ) : (
                                <div className="slider-container">
                                    <button
                                        className="slider-button prev"
                                        onClick={handlePrevSlide}
                                        disabled={currentSlideIndex === 0}
                                    >
                                        ‹
                                    </button>
                                    <div className="slider-wrapper">
                                        <div
                                            className="slider-track"
                                            style={{
                                                transform: `translateX(-${currentSlideIndex * (100 / visibleDressCount)}%)`
                                            }}
                                        >
                                            {filteredDresses.map((dress) => (
                                                <div key={dress.id} className="dress-card">
                                                    <div className="dress-image-wrapper">
                                                        <img
                                                            src={dress.image || dress.dress_image}
                                                            alt={dress.name || dress.dress_name}
                                                            className="dress-image"
                                                        />
                                                    </div>
                                                    <div className="dress-info">
                                                        <p className="dress-name">{dress.name || dress.dress_name}</p>
                                                        {dress.category && (
                                                            <p className="dress-category">{dress.category}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        className="slider-button next"
                                        onClick={handleNextSlide}
                                        disabled={currentSlideIndex >= filteredDresses.length - visibleDressCount}
                                    >
                                        ›
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default BodyAnalysis

