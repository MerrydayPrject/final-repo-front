import { useState, useRef } from 'react'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import Modal from '../components/Modal'
import '../styles/BodyTypeFitting.css'
import { analyzeBody } from '../utils/api'

const DRESS_CATEGORY_LABELS = {
    ballgown: '벨라인',
    mermaid: '머메이드',
    princess: '프린세스',
    aline: 'A라인',
    slim: '슬림',
    trumpet: '트럼펫',
    mini: '미니드레스',
    squareneck: '스퀘어넥',
    hanbok: '한복'
}

const DRESS_CATEGORY_KEYWORDS = {
    ballgown: ['벨라인', '벨트', '하이웨이스트', '벨티드', 'belt', 'bell line'],
    mermaid: ['머메이드', 'mermaid', '물고기', '피쉬', 'fish'],
    princess: ['프린세스', 'princess', '프린세스라인', 'princess line'],
    aline: ['a라인', 'aline', '에이라인', '에이 라인', '에이-라인', 'a-line'],
    slim: ['슬림', '스트레이트', 'straight', 'h라인', 'h-line', '슬림핏', '슬림 핏'],
    trumpet: ['트럼펫', 'trumpet', '플레어', 'flare'],
    mini: ['미니드레스', '미니 드레스', '미니', 'mini'],
    squareneck: ['스퀘어넥', 'square neck'],
    hanbok: ['한복']
}

const SOFT_FEATURE_MAP = {
    '키가 작은 체형': '키가 작으신 체형',
    '키가 큰 체형': '키가 크신 체형',
    '허리가 짧은 체형': '허리 비율이 짧으신 체형',
    '어깨가 넓은 체형': '균형잡힌 상체 체형',
    '어깨가 좁은 체형': '어깨라인이 슬림한 체형',
    '마른 체형': '슬림한 체형',
    '글래머러스한 체형': '곡선미가 돋보이는 체형',
    '팔 라인이 신경 쓰이는 체형': '팔라인이 신경 쓰이는 체형',
    '복부가 신경 쓰이는 체형': ''
}

const extractDressCategories = (text = '') => {
    if (!text) return []

    const lowerText = text.toLowerCase()
    const matches = []

    Object.entries(DRESS_CATEGORY_KEYWORDS).forEach(([categoryId, keywords]) => {
        let firstIndex = -1
        keywords.forEach((keyword) => {
            const index = lowerText.indexOf(keyword.toLowerCase())
            if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
                firstIndex = index
            }
        })

        if (firstIndex !== -1) {
            matches.push({ categoryId, index: firstIndex })
        }
    })

    matches.sort((a, b) => a.index - b.index)
    return matches.map((match) => match.categoryId)
}

const formatAnalysisText = (text = '') => {
    if (!text) return []

    const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

    return lines.map((line) => {
        const bulletNormalized = line.replace(/\*\s+/g, '• ')
        const segments = []
        const boldRegex = /\*\*(.*?)\*\*/g
        let lastIndex = 0
        let match

        while ((match = boldRegex.exec(bulletNormalized)) !== null) {
            if (match.index > lastIndex) {
                segments.push({
                    text: bulletNormalized.slice(lastIndex, match.index),
                    bold: false
                })
            }
            segments.push({
                text: match[1],
                bold: true
            })
            lastIndex = match.index + match[0].length
        }

        if (lastIndex < bulletNormalized.length) {
            segments.push({
                text: bulletNormalized.slice(lastIndex),
                bold: false
            })
        }

        return segments
    })
}

const parseGeminiAnalysis = (analysisText = '') => {
    if (!analysisText) {
        return {
            recommended: [],
            avoid: [],
            paragraphs: []
        }
    }

    const lowerText = analysisText.toLowerCase()
    const avoidIndex = lowerText.indexOf('피해야')

    const recommendationSection =
        avoidIndex !== -1 ? analysisText.slice(0, avoidIndex) : analysisText
    const avoidSection = avoidIndex !== -1 ? analysisText.slice(avoidIndex) : ''

    const recommended = extractDressCategories(recommendationSection)
    const avoid = extractDressCategories(avoidSection)
    const filteredRecommended = recommended.filter((cat) => !avoid.includes(cat)).slice(0, 2)

    return {
        recommended: filteredRecommended,
        avoid,
        paragraphs: formatAnalysisText(analysisText)
    }
}

const BodyAnalysis = ({ onBackToMain, onNavigateToFittingWithCategory }) => {
    const [uploadedImage, setUploadedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [recommendedCategories, setRecommendedCategories] = useState([])
    const [avoidCategories, setAvoidCategories] = useState([])
    const [analysisParagraphs, setAnalysisParagraphs] = useState([])
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMessage, setModalMessage] = useState('')
    const fileInputRef = useRef(null)

    // 카테고리명을 한글로 변환하는 함수
    const getCategoryName = (category) => DRESS_CATEGORY_LABELS[category.toLowerCase()] || category


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
            setAvoidCategories([])
            setAnalysisParagraphs([])
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

        const heightValue = parseFloat(height)
        const weightValue = parseFloat(weight)

        if (Number.isNaN(heightValue) || heightValue < 100 || heightValue > 250) {
            setModalMessage('키는 100cm 이상 250cm 이하로 입력해주세요.')
            setModalOpen(true)
            return
        }

        if (Number.isNaN(weightValue) || weightValue < 30 || weightValue > 200) {
            setModalMessage('몸무게는 30kg 이상 200kg 이하로 입력해주세요.')
            setModalOpen(true)
            return
        }

        setIsAnalyzing(true)
        try {
            const result = await analyzeBody(uploadedImage, heightValue, weightValue)

            if (!result.success) {
                throw new Error(result.message || '체형 분석에 실패했습니다.')
            }

            setAnalysisResult(result)

            const parsedGemini = parseGeminiAnalysis(result.gemini_analysis?.detailed_analysis || '')
            setRecommendedCategories(parsedGemini.recommended)
            setAvoidCategories(parsedGemini.avoid)
            setAnalysisParagraphs(parsedGemini.paragraphs)
        } catch (error) {
            console.error('분석 오류:', error)
            const errorMessage = error.response?.data?.message || error.message || '이미지 분석 중 오류가 발생했습니다.'
            setModalMessage(errorMessage)
            setModalOpen(true)
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
                                                setRecommendedCategories([])
                                                setAvoidCategories([])
                                                setAnalysisParagraphs([])
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
                                            {avoidCategories.length > 0 && (
                                                <div className="result-item avoid-categories-item">
                                                    <div className="recommended-categories-header">
                                                        <strong>주의할 카테고리:</strong>
                                                        <div className="recommended-categories">
                                                            {avoidCategories.map((category, index) => (
                                                                <span
                                                                    key={`${category}-${index}`}
                                                                    className="category-badge avoid-category"
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
                                                    {Number.isFinite(Number(analysisResult.body_analysis?.bmi)) && (
                                                        <div className="body-info-item-single">
                                                            <strong>BMI:</strong>
                                                            <span>{Number(analysisResult.body_analysis.bmi).toFixed(1)}</span>
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
                                                        {Array.from(new Set(
                                                            analysisResult.body_analysis.body_features
                                                                .map((feature) => {
                                                                    const friendly = SOFT_FEATURE_MAP[feature]
                                                                    if (friendly === undefined) return feature
                                                                    return friendly
                                                                })
                                                                .filter((feature) => feature && feature.trim())
                                                        )).map((feature, index) => (
                                                            <li key={index}>{feature}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {analysisResult.body_analysis?.measurements && (
                                                <div className="result-item measurements-item">
                                                    <strong>측정 지표:</strong>
                                                    <div className="measurements-grid">
                                                        {Number.isFinite(Number(analysisResult.body_analysis.measurements.shoulder_hip_ratio)) && (
                                                            <div className="measurement-item">
                                                                <span className="measurement-label">어깨·엉덩이 비율</span>
                                                                <span className="measurement-value">
                                                                    {Number(analysisResult.body_analysis.measurements.shoulder_hip_ratio).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {Number.isFinite(Number(analysisResult.body_analysis.measurements.waist_shoulder_ratio)) && (
                                                            <div className="measurement-item">
                                                                <span className="measurement-label">허리·어깨 비율</span>
                                                                <span className="measurement-value">
                                                                    {Number(analysisResult.body_analysis.measurements.waist_shoulder_ratio).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {Number.isFinite(Number(analysisResult.body_analysis.measurements.waist_hip_ratio)) && (
                                                            <div className="measurement-item">
                                                                <span className="measurement-label">허리·엉덩이 비율</span>
                                                                <span className="measurement-value">
                                                                    {Number(analysisResult.body_analysis.measurements.waist_hip_ratio).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="result-item analysis-item">
                                                <strong>상세 분석:</strong>
                                                <div className="analysis-description">
                                                    {analysisParagraphs.length > 0 ? (
                                                        analysisParagraphs.map((segments, lineIndex) => (
                                                            <p key={lineIndex} className="analysis-description-line">
                                                                {segments.map((segment, segmentIndex) => (
                                                                    segment.bold ? (
                                                                        <strong key={segmentIndex}>{segment.text}</strong>
                                                                    ) : (
                                                                        <span key={segmentIndex}>{segment.text}</span>
                                                                    )
                                                                ))}
                                                            </p>
                                                        ))
                                                    ) : (
                                                        <p>{analysisResult.gemini_analysis?.detailed_analysis || analysisResult.message || '체형 분석이 완료되었습니다.'}</p>
                                                    )}
                                                </div>
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

