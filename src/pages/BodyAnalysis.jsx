import { useState, useRef, useEffect } from 'react'
import '../styles/BodyTypeFitting.css'
import { analyzeBody, getDresses } from '../utils/api'

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
            if (response.success && response.data) {
                // 백엔드 응답 형식에 맞게 변환
                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                const transformedDresses = response.data.map((dress) => ({
                    id: dress.id,
                    name: dress.image_name?.replace(/\.[^/.]+$/, '') || `드레스 ${dress.id}`,
                    image: `${apiBaseUrl}/api/proxy-image?url=${encodeURIComponent(dress.url)}`,
                    originalUrl: dress.url,
                    category: dress.style || 'all',
                    description: `${dress.style || ''} 스타일의 드레스`
                }))
                setAllDresses(transformedDresses)
            } else if (response.success && response.dresses) {
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
            const result = await analyzeBody(uploadedImage)

            if (!result.success) {
                throw new Error(result.message || '체형 분석에 실패했습니다.')
            }

            setAnalysisResult(result)

            // Gemini 분석에서 추천 카테고리 추출 (Gemini 응답에서 카테고리명 찾기)
            let recommendedCategories = []
            if (result.gemini_analysis?.detailed_analysis) {
                const analysisText = result.gemini_analysis.detailed_analysis.toLowerCase()
                const categories = ['벨라인', '머메이드', '프린세스', 'aline', 'a라인', '슬림', '트럼펫']
                const categoryMap = {
                    '벨라인': 'ballgown',
                    '머메이드': 'mermaid',
                    '프린세스': 'princess',
                    'aline': 'aline',
                    'a라인': 'aline',
                    '슬림': 'slim',
                    '트럼펫': 'trumpet'
                }

                categories.forEach(cat => {
                    if (analysisText.includes(cat.toLowerCase())) {
                        const mapped = categoryMap[cat] || cat
                        if (!recommendedCategories.includes(mapped)) {
                            recommendedCategories.push(mapped)
                        }
                    }
                })
            }

            // 추천 카테고리에 맞는 드레스 필터링
            if (recommendedCategories.length > 0) {
                const filtered = allDresses.filter(dress => {
                    const dressCategory = (dress.category || '').toLowerCase()
                    return recommendedCategories.some(recCat =>
                        dressCategory === recCat.toLowerCase() ||
                        dressCategory.includes(recCat.toLowerCase())
                    )
                })
                setFilteredDresses(filtered.length > 0 ? filtered : allDresses)
            } else {
                // 카테고리 정보가 없으면 전체 드레스 표시
                setFilteredDresses(allDresses)
            }
            setCurrentSlideIndex(0) // 슬라이더 위치 초기화
        } catch (error) {
            console.error('분석 오류:', error)
            const errorMessage = error.response?.data?.message || error.message || '이미지 분석 중 오류가 발생했습니다.'
            alert(errorMessage)
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
                                                <strong>체형 유형:</strong> {analysisResult.body_analysis?.body_type || analysisResult.body_analysis?.body_type_category?.type || '분석 중...'}
                                            </div>
                                            <div className="result-item">
                                                <strong>체형 측정:</strong>
                                                {analysisResult.body_analysis?.measurements && (
                                                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                                        <li>어깨/엉덩이 비율: {analysisResult.body_analysis.measurements.shoulder_hip_ratio?.toFixed(2) || '-'}</li>
                                                        <li>허리/어깨 비율: {analysisResult.body_analysis.measurements.waist_shoulder_ratio?.toFixed(2) || '-'}</li>
                                                        <li>허리/엉덩이 비율: {analysisResult.body_analysis.measurements.waist_hip_ratio?.toFixed(2) || '-'}</li>
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="result-item">
                                                <strong>상세 분석:</strong>
                                                <p className="analysis-description">
                                                    {analysisResult.gemini_analysis?.detailed_analysis || analysisResult.message || '체형 분석이 완료되었습니다.'}
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
                                    {analysisResult && filteredDresses.length > 0
                                        ? '추천 드레스'
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

