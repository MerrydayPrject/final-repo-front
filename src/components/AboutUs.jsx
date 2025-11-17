import { useEffect, useRef, useState } from 'react'
import '../styles/AboutUs.css'

const AboutUs = ({ onNavigateToGeneral, onNavigateToCustom, onNavigateToAnalysis }) => {
    const sectionRef = useRef(null)
    const textItem1Ref = useRef(null)
    const textItem2Ref = useRef(null)
    const textItem3Ref = useRef(null)
    const [isVisible, setIsVisible] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isFading, setIsFading] = useState(false)
    const [visibleItems, setVisibleItems] = useState([false, false, false])

    const images = [
        '/Image/About1.jpg',
        '/Image/About2.jpg',
        '/Image/About3.jpg'
    ]

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true)
                    }
                })
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px 0px 0px'
            }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current)
            }
        }
    }, [])

    // 각 텍스트 아이템의 가시성 감지
    useEffect(() => {
        const textItems = [textItem1Ref, textItem2Ref, textItem3Ref]
        const observers = []

        textItems.forEach((ref, index) => {
            if (ref.current) {
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            // 화면에 들어오면 표시 (50% 이상)
                            const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5
                            setVisibleItems((prev) => {
                                const newVisible = [...prev]
                                // 마지막 텍스트(인덱스 2)는 한 번 visible이 되면 계속 유지
                                if (index === 2 && isVisible) {
                                    newVisible[index] = true
                                } else if (index !== 2) {
                                    // 다른 텍스트는 화면에 있을 때만 표시
                                    newVisible[index] = isVisible
                                }
                                return newVisible
                            })
                        })
                    },
                    {
                        threshold: [0, 0.3, 0.5, 0.7, 1.0],
                        rootMargin: '0px 0px -20% 0px'
                    }
                )
                observer.observe(ref.current)
                observers.push(observer)
            }
        })

        return () => {
            observers.forEach((observer, index) => {
                if (textItems[index].current) {
                    observer.unobserve(textItems[index].current)
                }
            })
        }
    }, [])

    // 이미지 자동 로테이션
    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setIsFading(true)
                setTimeout(() => {
                    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
                    setIsFading(false)
                }, 1000) // 페이드 아웃 시간
            }, 4000) // 4초마다 이미지 변경

            return () => clearInterval(interval)
        }
    }, [isVisible, images.length])

    return (
        <section ref={sectionRef} className={`about-us-section ${isVisible ? 'visible' : ''}`}>
            <h2 className="about-us-title">About us</h2>
            <div className="about-us-content-wrapper">
                <div className="left-container">
                    <div className="about-us-text-content">
                        <div
                            ref={textItem1Ref}
                            className={`about-us-text-item ${visibleItems[0] ? 'visible' : ''}`}
                        >
                            <h3 className="about-us-main-text">AI 자동 피팅 체험</h3>
                            <p className="about-us-description">
                                원하는 드레스 이미지를 목록에서 골라 전신 사진 위로 가볍게 드래그해보세요.
                                AI가 자연스럽게 맞춰 실제 입어본 듯한 모습을 바로 보여드립니다
                                복잡한 과정 없이 드래그 한 번으로 다양한 스타일을 쉽고 자연스럽게 체험해보실 수 있습니다

                            </p>
                            {onNavigateToGeneral && (
                                <button
                                    className="about-us-navigate-button"
                                    onClick={onNavigateToGeneral}
                                >
                                    <span>일반피팅 바로가기 →</span>
                                    <svg className="circle-animation" width="180" height="80" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                                        <ellipse
                                            cx="90"
                                            cy="40"
                                            rx="88"
                                            ry="38"
                                            fill="none"
                                            stroke="#ad9f41"
                                            strokeWidth="2"
                                            strokeDasharray="400"
                                            strokeDashoffset="400"
                                            className="circle-path"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div
                            ref={textItem2Ref}
                            className={`about-us-text-item ${visibleItems[1] ? 'visible' : ''}`}
                        >
                            <h3 className="about-us-main-text">커스텀 피팅 체험</h3>
                            <p className="about-us-description">
                                원하시는 드레스가 목록에 없어도 걱정하지 않으셔도 됩니다. <br />
                                고객님이 직접 가져오신 드레스 이미지를 업로드하면 AI가 전신 사진과 자연스럽게 맞춰
                                마치 바로 입어본 듯한 피팅 결과를 만들어드립니다.
                                원하는 어떤 드레스든 자유롭게 입어보는 경험을 편하게 즐겨보세요.

                            </p>
                            {onNavigateToCustom && (
                                <button
                                    className="about-us-navigate-button"
                                    onClick={onNavigateToCustom}
                                >
                                    <span>커스텀 피팅 바로가기 →</span>
                                    <svg className="circle-animation" width="180" height="80" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                                        <ellipse
                                            cx="90"
                                            cy="40"
                                            rx="88"
                                            ry="38"
                                            fill="none"
                                            stroke="#ad9f41"
                                            strokeWidth="2"
                                            strokeDasharray="400"
                                            strokeDashoffset="400"
                                            className="circle-path"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div
                            ref={textItem3Ref}
                            className={`about-us-text-item ${visibleItems[2] ? 'visible' : ''}`}
                        >
                            <h3 className="about-us-main-text">AI 체형 분석</h3>
                            <p className="about-us-description">
                                고객님의 전신 사진을 업로드하면 AI가 전체적인 비율과 실루엣을 분석해드립니다.
                                체형 특징을 바탕으로 어떤 스타일이 잘 어울릴지 미리 이해할 수 있어
                                드레스를 선택하기 전 더욱 정확한 기준을 갖고 비교해보실 수 있습니다

                            </p>
                            {onNavigateToAnalysis && (
                                <button
                                    className="about-us-navigate-button"
                                    onClick={onNavigateToAnalysis}
                                >
                                    <span>체형분석 바로가기 →</span>
                                    <svg className="circle-animation" width="180" height="80" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                                        <ellipse
                                            cx="90"
                                            cy="40"
                                            rx="88"
                                            ry="38"
                                            fill="none"
                                            stroke="#ad9f41"
                                            strokeWidth="2"
                                            strokeDasharray="400"
                                            strokeDashoffset="400"
                                            className="circle-path"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="right-container">
                    <div className="about-us-image-container">
                        <img
                            src={images[currentImageIndex]}
                            alt={`About us ${currentImageIndex + 1}`}
                            className={`about-us-rotating-image ${isFading ? 'fade-out' : 'fade-in'}`}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AboutUs

