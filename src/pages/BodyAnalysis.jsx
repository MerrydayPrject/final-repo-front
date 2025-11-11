import { useState, useRef } from 'react'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import '../styles/BodyTypeFitting.css'
import { analyzeBody } from '../utils/api'

const BodyAnalysis = ({ onBackToMain, onNavigateToFittingWithCategory }) => {
    const [uploadedImage, setUploadedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [recommendedCategories, setRecommendedCategories] = useState([])
    const fileInputRef = useRef(null)

    // 카테고리명을 한글로 변환하는 함수
    const getCategoryName = (category) => {
        const categoryNames = {
            'ballgown': '벨라인',
            'mermaid': '머메이드',
            'princess': '프린세스',
            'aline': 'A라인',
            'slim': '슬림',
            'trumpet': '트럼펫',
            'mini': '미니드레스',
            'squareneck': '스퀘어넥',
            'hanbok': '한복'
        }
        return categoryNames[category.toLowerCase()] || category
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
            setRecommendedCategories([])
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
            let extractedCategories = []
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
                        if (!extractedCategories.includes(mapped)) {
                            extractedCategories.push(mapped)
                        }
                    }
                })
            }

            // 추천 카테고리 state 업데이트
            setRecommendedCategories(extractedCategories)
        } catch (error) {
            console.error('분석 오류:', error)
            const errorMessage = error.response?.data?.message || error.message || '이미지 분석 중 오류가 발생했습니다.'
            alert(errorMessage)
        } finally {
            setIsAnalyzing(false)
        }
    }


    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper">
                    <div className="left-container">
                        <div className="general-fitting-header">
                            <h2 className="general-fitting-title">체형 분석</h2>
                            <div className="tab-guide-text-wrapper">
                                <div className="tab-guide-text">
                                    AI가 당신의 체형을 자동으로 분석하고 최적의 드레스를 추천해드립니다
                                </div>
                                <button className="faq-button">
                                    <HiQuestionMarkCircle />
                                    <div className="tooltip">전신사진을 업로드한 후 분석하기 버튼을 눌러주세요</div>
                                </button>
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
                                            {/* 추천 카테고리 - 맨 위 */}
                                            {recommendedCategories.length > 0 && (
                                                <div className="result-item recommended-categories-item">
                                                    <strong>추천 카테고리:</strong>
                                                    <div className="recommended-categories">
                                                        {recommendedCategories.map((category, index) => (
                                                            <span
                                                                key={index}
                                                                className="category-badge"
                                                                onClick={() => {
                                                                    if (onNavigateToFittingWithCategory) {
                                                                        onNavigateToFittingWithCategory(category)
                                                                    }
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                {getCategoryName(category)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="result-item body-type-item">
                                                <strong>체형 유형:</strong> {analysisResult.body_analysis?.body_type || analysisResult.body_analysis?.body_type_category?.type || '분석 중...'}
                                            </div>
                                            <div className="result-item measurements-item">
                                                <strong>체형 측정:</strong>
                                                {analysisResult.body_analysis?.measurements && (
                                                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                                        <li>어깨/엉덩이 비율: {analysisResult.body_analysis.measurements.shoulder_hip_ratio?.toFixed(2) || '-'}</li>
                                                        <li>허리/어깨 비율: {analysisResult.body_analysis.measurements.waist_shoulder_ratio?.toFixed(2) || '-'}</li>
                                                        <li>허리/엉덩이 비율: {analysisResult.body_analysis.measurements.waist_hip_ratio?.toFixed(2) || '-'}</li>
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="result-item analysis-item">
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
                    </div>
                </div>
            </div>
        </main>
    )
}

export default BodyAnalysis

