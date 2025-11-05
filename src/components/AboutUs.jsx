import { useEffect, useRef, useState } from 'react'
import '../styles/AboutUs.css'

const AboutUs = () => {
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
                                사진 한 장만 업로드하면 AI가 당신에게 가장 잘 어울리는 웨딩드레스를 찾아보세요
                                다양한 스타일의 드레스를 비교하고, 실제 착용 모습을 미리 확인해보세요
                                당신만의 완벽한 웨딩드레스를 찾는 여정을 시작하세요
                            </p>
                        </div>
                        <div
                            ref={textItem2Ref}
                            className={`about-us-text-item ${visibleItems[1] ? 'visible' : ''}`}
                        >
                            <h3 className="about-us-main-text">3D 실감 피팅 체험</h3>
                            <p className="about-us-description">
                                AI가 결과 이미지를 입체감 있는 3D 형태로 변환해
                                드레스의 실루엣과 볼륨을 현실감 있게 표현합니다
                                360도 각도에서 나만의 웨딩드레스 핏을 확인해보세요
                            </p>
                        </div>
                        <div
                            ref={textItem3Ref}
                            className={`about-us-text-item ${visibleItems[2] ? 'visible' : ''}`}
                        >
                            <h3 className="about-us-main-text">AI 맞춤 체형 피팅</h3>
                            <p className="about-us-description">
                                사용자 이미지를 업로드하면 AI가 체형을 분석해 어울리는 드레스를 추천하고,
                                보정 탭에서 AI 기반으로 자연스러운 이미지 보정도 제공합니다
                            </p>
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

