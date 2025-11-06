import { useState, useRef, useEffect, useCallback } from 'react'
import Modal from '../components/Modal'
import { autoMatchImage, getDresses } from '../utils/api'
import '../styles/App.css'
import '../styles/ImageUpload.css'
import '../styles/DressSelection.css'

const GeneralFitting = ({ onBackToMain }) => {
    // General Fitting 상태
    const [uploadedImage, setUploadedImage] = useState(null)
    const [selectedDress, setSelectedDress] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [generalResultImage, setGeneralResultImage] = useState(null)
    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false)
    const [pendingDress, setPendingDress] = useState(null)

    // ImageUpload 상태
    const [preview, setPreview] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [showCheckmark, setShowCheckmark] = useState(false)
    const fileInputRef = useRef(null)
    const prevProcessingRef = useRef(isProcessing)

    // DressSelection 상태
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [scrollPosition, setScrollPosition] = useState(0)
    const [displayCount, setDisplayCount] = useState(6)
    const [categoryStartIndex, setCategoryStartIndex] = useState(0)
    const [dresses, setDresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const isDraggingRef = useRef(false)
    const isScrollingFromSlider = useRef(false)
    const containerRef = useRef(null)
    const contentRef = useRef(null)

    // 카테고리 정의
    const categories = [
        { id: 'all', name: '전체' },
        { id: 'ballgown', name: '벨라인' },
        { id: 'mermaid', name: '머메이드' },
        { id: 'princess', name: '프린세스' },
        { id: 'aline', name: 'A라인' },
        { id: 'slim', name: '슬림' },
        { id: 'trumpet', name: '트럼펫' },
        { id: 'mini', name: '미니드레스' },
        { id: 'squareneck', name: '스퀘어넥' },
        { id: 'hanbok', name: '한복' }
    ]

    // 한 번에 보여질 카테고리 수
    const categoriesPerView = 5
    const maxStartIndex = Math.max(0, categories.length - categoriesPerView)
    const visibleCategories = categories.slice(
        categoryStartIndex,
        categoryStartIndex + categoriesPerView
    )

    // 스타일을 카테고리로 변환하는 함수
    const styleToCategory = (style) => {
        const styleMap = {
            'A라인': 'aline',
            '미니드레스': 'mini',
            '벨라인': 'ballgown',
            '프린세스': 'princess',
            '슬림': 'slim',
            '한복': 'hanbok',
            '머메이드': 'mermaid',
            '트럼펫': 'trumpet',
            '스퀘어넥': 'squareneck'
        }
        return styleMap[style] || 'all'
    }

    // 드레스 목록 로드
    useEffect(() => {
        const loadDresses = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await getDresses()

                if (response.success && response.data) {
                    // DB에서 받은 URL을 백엔드 프록시를 통해 제공
                    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                    const transformedDresses = response.data.map((dress) => ({
                        id: dress.id,
                        name: dress.image_name.replace(/\.[^/.]+$/, ''),
                        // 썸네일은 백엔드 프록시 사용, 실제 합성에는 원본 S3 URL 사용
                        image: `${apiBaseUrl}/api/proxy-image?url=${encodeURIComponent(dress.url)}`,
                        originalUrl: dress.url,  // 합성용 원본 URL 보관
                        description: `${dress.style} 스타일의 드레스`,
                        category: styleToCategory(dress.style)
                    }))
                    setDresses(transformedDresses)
                } else {
                    setError('드레스 목록을 불러올 수 없습니다.')
                    setDresses([])
                }
            } catch (err) {
                console.error('드레스 목록 로드 오류:', err)
                setError('드레스 목록을 불러오는 중 오류가 발생했습니다.')
                setDresses([])
            } finally {
                setLoading(false)
            }
        }

        loadDresses()
    }, [])

    // 매칭 완료 감지
    useEffect(() => {
        if (prevProcessingRef.current && !isProcessing && generalResultImage) {
            setShowCheckmark(true)
            const timer = setTimeout(() => {
                setShowCheckmark(false)
            }, 1500)
            return () => clearTimeout(timer)
        }
        prevProcessingRef.current = isProcessing
    }, [isProcessing, generalResultImage])

    // General Fitting 핸들러
    const handleImageUpload = (image) => {
        setUploadedImage(image)
        setGeneralResultImage(null)
    }

    const handleDressSelect = (dress) => {
        setSelectedDress(dress)
    }

    const handleDressDropped = async (dress) => {
        if (!uploadedImage || !dress) return

        setIsProcessing(true)

        try {
            const result = await autoMatchImage(uploadedImage, dress)

            if (result.success && result.result_image) {
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
            alert(`매칭 중 오류가 발생했습니다: ${friendly}`)
        }
    }

    const openImageUploadModal = (dress) => {
        setPendingDress(dress)
        setImageUploadModalOpen(true)
    }

    const closeImageUploadModal = () => {
        setImageUploadModalOpen(false)
        setPendingDress(null)
    }

    const handleImageUploadedForDress = (image) => {
        setUploadedImage(image)
        closeImageUploadModal()

        if (pendingDress) {
            setTimeout(() => {
                handleDressDropped(pendingDress)
            }, 100)
        }
    }

    const handleImageUploadRequired = (dress) => {
        openImageUploadModal(dress)
    }

    // ImageUpload 핸들러
    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('image/')) {
            handleFile(file)
        }
    }

    const handleFile = (file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result)
            handleImageUpload(file)
        }
        reader.readAsDataURL(file)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY

        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDragging(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)

        const dressData = e.dataTransfer.getData('application/json')
        if (dressData) {
            try {
                const dress = JSON.parse(dressData)

                if (!preview && handleImageUploadRequired) {
                    handleImageUploadRequired(dress)
                    return
                }

                if (handleDressDropped) {
                    handleDressDropped(dress)
                }
                return
            } catch (error) {
                console.error('드레스 데이터 파싱 오류:', error)
            }
        }

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            handleFile(file)
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleRemove = () => {
        setPreview(null)
        handleImageUpload(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // DressSelection 핸들러
    const filteredDresses = selectedCategory === 'all'
        ? dresses
        : dresses.filter(dress => dress.category === selectedCategory)

    const handleDressClick = (dress) => {
        handleDressSelect(dress)
    }

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId)
        setDisplayCount(6)
    }

    const handleDragStart = (e, dress) => {
        e.dataTransfer.effectAllowed = 'copy'
        try { e.dataTransfer.dropEffect = 'copy' } catch { }
        e.dataTransfer.setData('application/json', JSON.stringify(dress))
        try {
            document.body.classList.add('dragging-dress')
        } catch { }
        const forceCopyCursor = (ev) => {
            ev.preventDefault()
            try { ev.dataTransfer.dropEffect = 'copy' } catch { }
        }
        const resetCursor = () => {
            try {
                document.body.classList.remove('dragging-dress')
            } catch { }
            window.removeEventListener('dragover', forceCopyCursor)
            window.removeEventListener('dragend', resetCursor)
            window.removeEventListener('drop', resetCursor)
            window.removeEventListener('mouseup', resetCursor)
        }
        window.addEventListener('dragover', forceCopyCursor)
        window.addEventListener('dragend', resetCursor)
        window.addEventListener('drop', resetCursor)
        window.addEventListener('mouseup', resetCursor)
    }

    // 슬라이더 위치 업데이트
    useEffect(() => {
        if (isDraggingRef.current && containerRef.current && contentRef.current) {
            isScrollingFromSlider.current = true
            const maxScroll = contentRef.current.scrollHeight - containerRef.current.clientHeight
            if (maxScroll > 0) {
                contentRef.current.scrollTop = (scrollPosition / 100) * maxScroll
            }
            setTimeout(() => {
                isScrollingFromSlider.current = false
            }, 50)
        }
    }, [scrollPosition])

    // 스크롤 이벤트로 슬라이더 위치 동기화
    useEffect(() => {
        const container = contentRef.current
        if (!container) return

        const handleScroll = () => {
            if (isScrollingFromSlider.current) return

            const maxScroll = container.scrollHeight - container.clientHeight
            if (maxScroll > 0) {
                const currentScroll = container.scrollTop
                const percentage = (currentScroll / maxScroll) * 100
                setScrollPosition(percentage)

                if (percentage > 80 && displayCount < filteredDresses.length) {
                    setDisplayCount(prev => Math.min(prev + 6, filteredDresses.length))
                }
            }
        }

        container.addEventListener('scroll', handleScroll)
        return () => {
            container.removeEventListener('scroll', handleScroll)
        }
    }, [displayCount, filteredDresses.length])

    const updateSliderPosition = useCallback((clientY) => {
        const track = document.querySelector('.slider-track')
        if (track) {
            const rect = track.getBoundingClientRect()
            const y = clientY - rect.top
            const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100))
            setScrollPosition(percentage)
        }
    }, [])

    const handleSliderMouseMove = useCallback((e) => {
        if (isDraggingRef.current) {
            e.preventDefault()
            updateSliderPosition(e.clientY)
        }
    }, [updateSliderPosition])

    const handleSliderMouseUp = useCallback(() => {
        isDraggingRef.current = false
        document.removeEventListener('mousemove', handleSliderMouseMove)
        document.removeEventListener('mouseup', handleSliderMouseUp)
    }, [handleSliderMouseMove])

    const handleSliderMouseDown = (e) => {
        e.preventDefault()
        isDraggingRef.current = true
        updateSliderPosition(e.clientY)
        document.addEventListener('mousemove', handleSliderMouseMove)
        document.addEventListener('mouseup', handleSliderMouseUp)
    }

    const handleArrowClick = (direction) => {
        isDraggingRef.current = true
        const step = 10
        if (direction === 'up') {
            setScrollPosition(Math.max(0, scrollPosition - step))
        } else {
            setScrollPosition(Math.min(100, scrollPosition + step))
        }
        setTimeout(() => {
            isDraggingRef.current = false
        }, 100)
    }

    const handleCategoryNavigation = (direction) => {
        if (direction === 'prev' && categoryStartIndex > 0) {
            setCategoryStartIndex(categoryStartIndex - 1)
        } else if (direction === 'next' && categoryStartIndex < maxStartIndex) {
            setCategoryStartIndex(categoryStartIndex + 1)
        }
    }

    const imageSrc = generalResultImage || preview
    const canDownload = !isProcessing && !!generalResultImage

    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper">
                    <div className="left-container">
                        <div className="general-fitting-header">
                            <h2 className="general-fitting-title">일반피팅</h2>
                            <div className="tab-guide-text">
                                드래그 한 번으로 웨딩드레스를 자동 피팅해보세요
                            </div>
                        </div>
                        {/* ImageUpload 컴포넌트 */}
                        <div className="image-upload">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            <div className="image-upload-wrapper">
                                {!preview ? (
                                    <div
                                        className={`upload-area ${isDragging ? 'dragging' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={handleClick}
                                    >
                                        <div className="upload-icon">
                                            <img src="/Image/body_icon.png" alt="전신사진 아이콘" />
                                        </div>
                                        <p className="upload-text">전신 또는 얼굴 이미지를 먼저 업로드 해주세요</p>
                                        <p className="upload-subtext">JPG, PNG, JPEG 형식 지원</p>
                                    </div>
                                ) : (
                                    <div
                                        className={`preview-container ${isDragging ? 'dragging' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <img src={imageSrc} alt="Preview" className="preview-image" />
                                        {isProcessing && (
                                            <div className="processing-overlay">
                                                <img src="/Image/free-animated-icon-fitting-17904496.gif" alt="로딩중" className="spinner-gif" />
                                                <p>매칭 중...</p>
                                            </div>
                                        )}
                                        {showCheckmark && (
                                            <div className="processing-overlay">
                                                <div className="completion-icon">✓</div>
                                                <p>매칭완료</p>
                                            </div>
                                        )}
                                        {isDragging && (
                                            <div className="drop-overlay">
                                                <p>드레스를 여기에 드롭하세요</p>
                                            </div>
                                        )}
                                        <button className="remove-button" onClick={handleRemove}>
                                            ✕
                                        </button>
                                        {canDownload && imageSrc && !isProcessing && (
                                            <button
                                                className="download-button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    try {
                                                        const link = document.createElement('a')
                                                        link.href = imageSrc
                                                        link.download = 'match_result.png'
                                                        document.body.appendChild(link)
                                                        link.click()
                                                        document.body.removeChild(link)
                                                    } catch (err) {
                                                        console.error('다운로드 실패:', err)
                                                    }
                                                }}
                                                title="결과 이미지를 다운로드"
                                            >
                                                ⬇ 다운로드
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="background-selector">
                                    <button className="background-button active" disabled={!generalResultImage}>
                                        <img src="/Image/background1.jpg" alt="배경 1" />
                                    </button>
                                    <button className="background-button" disabled={!generalResultImage}>
                                        <span className="background-dot"></span>
                                    </button>
                                    <button className="background-button" disabled={!generalResultImage}>
                                        <span className="background-dot"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* 3D로 변환 버튼 */}
                        <button
                            className="convert-3d-button"
                            onClick={() => {
                                // 3D 변환 로직 추가 필요
                                alert('3D 변환 기능은 준비 중입니다.')
                            }}
                            disabled={!generalResultImage}
                        >
                            3D로 변환
                        </button>
                    </div>

                    <div className="right-container">
                        {/* DressSelection 컴포넌트 */}
                        <div className="dress-selection">
                            <div className="category-buttons-wrapper">
                                <button
                                    className="category-nav-button prev"
                                    onClick={() => handleCategoryNavigation('prev')}
                                    disabled={categoryStartIndex === 0}
                                >
                                    ‹
                                </button>
                                <div className="category-buttons">
                                    {visibleCategories.map((category) => (
                                        <button
                                            key={category.id}
                                            className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                                            onClick={() => handleCategoryClick(category.id)}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className="category-nav-button next"
                                    onClick={() => handleCategoryNavigation('next')}
                                    disabled={categoryStartIndex === maxStartIndex}
                                >
                                    ›
                                </button>
                            </div>

                            <div className="dress-content-wrapper" ref={containerRef}>
                                <div className="dress-grid-container" ref={contentRef}>
                                    {loading && (
                                        <div className="dress-grid">
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                드레스 목록을 불러오는 중...
                                            </div>
                                        </div>
                                    )}
                                    {error && (
                                        <div className="dress-grid">
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                                                {error}
                                            </div>
                                        </div>
                                    )}
                                    {!loading && !error && (
                                        <div className="dress-grid">
                                            {filteredDresses.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                    등록된 드레스가 없습니다.
                                                </div>
                                            ) : (
                                                filteredDresses.slice(0, displayCount).map((dress) => (
                                                    <div
                                                        key={dress.id}
                                                        data-dress-id={dress.id}
                                                        className={`dress-card draggable ${selectedDress?.id === dress.id ? 'selected' : ''}`}
                                                        onClick={() => handleDressClick(dress)}
                                                        draggable={true}
                                                        onMouseDown={(e) => {
                                                            // 클릭 시 커서를 grabbing으로 고정
                                                            e.currentTarget.style.cursor = 'grabbing'
                                                        }}
                                                        onMouseUp={(e) => {
                                                            // 마우스 업 시 grab으로 복구
                                                            e.currentTarget.style.cursor = 'grab'
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            // 영역 벗어날 때도 복구
                                                            e.currentTarget.style.cursor = 'grab'
                                                        }}
                                                        onDragStart={(e) => handleDragStart(e, dress)}
                                                        onDragEnd={(e) => {
                                                            e.currentTarget.style.cursor = 'grab'
                                                        }}
                                                    >
                                                        <div className="dress-category-badge">
                                                            {categories.find(cat => cat.id === dress.category)?.name || '기타'}
                                                        </div>
                                                        <img src={dress.image} alt={dress.name} className="dress-image" draggable={false} />
                                                        {selectedDress?.id === dress.id && (
                                                            <div className="selected-badge">✓</div>
                                                        )}
                                                        <div className="drag-hint">드래그 가능</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {filteredDresses.length > 0 && (
                                    <div className="vertical-slider">
                                        <button
                                            className="slider-arrow slider-arrow-up"
                                            onClick={() => handleArrowClick('up')}
                                        >
                                            ▲
                                        </button>
                                        <div className="slider-track">
                                            <div
                                                className="slider-handle"
                                                style={{ top: `${scrollPosition}%` }}
                                                onMouseDown={handleSliderMouseDown}
                                            />
                                        </div>
                                        <button
                                            className="slider-arrow slider-arrow-down"
                                            onClick={() => handleArrowClick('down')}
                                        >
                                            ▼
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 이미지 업로드 모달 */}
            <Modal
                isOpen={imageUploadModalOpen}
                onClose={closeImageUploadModal}
                message="먼저 전신 사진을 업로드해주세요."
                center
            >
                <div style={{ marginTop: '20px' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files[0]
                            if (file && file.type.startsWith('image/')) {
                                handleImageUploadedForDress(file)
                            }
                        }}
                        style={{ display: 'none' }}
                        id="modal-image-input"
                    />
                    <label
                        htmlFor="modal-image-input"
                        style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            backgroundColor: '#2c2c2c',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        이미지 선택
                    </label>
                </div>
            </Modal>
        </main>
    )
}

export default GeneralFitting
