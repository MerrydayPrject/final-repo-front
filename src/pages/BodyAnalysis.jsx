import { useState, useRef } from 'react'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import Modal from '../components/Modal'
import '../styles/BodyTypeFitting.css'
import { analyzeBody } from '../utils/api'

const BodyAnalysis = ({ onBackToMain, onNavigateToFittingWithCategory }) => {
    const [uploadedImage, setUploadedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [recommendedCategories, setRecommendedCategories] = useState([])
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMessage, setModalMessage] = useState('')
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
            setModalMessage('먼저 이미지를 업로드해주세요!')
            setModalOpen(true)
            return
        }

        // 키와 몸무게가 입력되지 않았을 경우 모달 표시
        if (!height || !weight) {
            setModalMessage('키와 몸무게를 입력해주세요.')
            setModalOpen(true)
            return
        }

        setIsAnalyzing(true)
        try {
            const heightValue = parseFloat(height) || 0
            const weightValue = parseFloat(weight) || 0
            const result = await analyzeBody(uploadedImage, heightValue, weightValue)

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
                                                setHeight('')
                                                setWeight('')
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
                                {/* 키와 몸무게 입력 필드 */}
                                <div className="body-info-inputs">
                                    <div className="input-group">
                                        <label htmlFor="height">키 (cm) <span className="required-asterisk">*</span></label>
                                        <input
                                            id="height"
                                            type="number"
                                            placeholder="예: 165"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            min="0"
                                            step="0.1"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="weight">몸무게 (kg) <span className="required-asterisk">*</span></label>
                                        <input
                                            id="weight"
                                            type="number"
                                            placeholder="예: 55"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            min="0"
                                            step="0.1"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    className="analyze-button"
                                    onClick={handleAnalyze}
                                    disabled={!uploadedImage || isAnalyzing || analysisResult}
                                >
                                    {isAnalyzing ? (
                                        '분석중'
                                    ) : analysisResult ? (
                                        '분석완료'
                                    ) : (
                                        '분석하기'
                                    )}
                                </button>
                            </div>

                            {/* 우측: 분석 결과 영역 */}
                            <div className="analysis-result-area">
                                <div className="result-section-header">
                                    <h3 className="result-section-title">분석 결과</h3>
                                    {analysisResult && (
                                        <p className="result-section-description">카테고리를 선택하면 일반피팅 화면으로 이동됩니다</p>
                                    )}
                                </div>
                                <div className="result-box">
                                    {isAnalyzing ? (
                                        <div className="analysis-loading-container">
                                            <div className="loader">
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                            </div>
                                        </div>
                                    ) : !analysisResult ? (
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
                                                    <div className="recommended-categories-header">
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
                                                </div>
                                            )}
                                            <div className="result-item body-info-item">
                                                <div className="body-info-row">
                                                    <div className="body-info-item-single">
                                                        <strong>체형 유형:</strong>
                                                        <span>{analysisResult.body_analysis?.body_type || '분석 중...'}</span>
                                                    </div>
                                                    {analysisResult.body_analysis?.bmi && (
                                                        <div className="body-info-item-single">
                                                            <strong>BMI:</strong>
                                                            <span>{analysisResult.body_analysis.bmi.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {analysisResult.body_analysis?.height && (
                                                        <div className="body-info-item-single">
                                                            <strong>키:</strong>
                                                            <span>{analysisResult.body_analysis.height}cm</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {analysisResult.body_analysis?.body_features && analysisResult.body_analysis.body_features.length > 0 && (
                                                <div className="result-item body-features-item">
                                                    <strong>체형 특징:</strong>
                                                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                                        {analysisResult.body_analysis.body_features.map((feature, index) => (
                                                            <li key={index}>{feature}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <div className="result-item analysis-item">
                                                <strong>상세 분석:</strong>
                                                <p className="analysis-description">
                                                    {analysisResult.gemini_analysis?.detailed_analysis || analysisResult.message || '체형 분석이 완료되었습니다.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                message={modalMessage}
                center
            />
        </main>
    )
}

export default BodyAnalysis

