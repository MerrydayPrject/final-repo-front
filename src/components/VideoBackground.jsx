import { useEffect, useRef, useState } from 'react'
import '../styles/VideoBackground.css'

const VideoBackground = ({ onNavigateToFitting }) => {
    const videoRef = useRef(null)
    const videoBackgroundRef = useRef(null)
    const buttonRef = useRef(null)
    const [isSticky, setIsSticky] = useState(false)

    // 비디오가 로드되면 재생 속도 설정 및 재생
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleLoadedMetadata = () => {
            video.playbackRate = 0.5 // 절반 속도로 느리게 재생
            video.play().catch(err => console.error('Video play error:', err))
        }

        // 이미 메타데이터가 로드된 경우
        if (video.readyState >= 1) {
            handleLoadedMetadata()
        } else {
            video.addEventListener('loadedmetadata', handleLoadedMetadata)
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        }
    }, [])

    // 스크롤 감지하여 버튼 위치 조정
    useEffect(() => {
        const handleScroll = () => {
            if (!videoBackgroundRef.current || !buttonRef.current) return

            const videoBackground = videoBackgroundRef.current
            const aboutUsSection = document.querySelector('.about-us-section')
            
            if (!aboutUsSection) return

            const videoBottom = videoBackground.offsetTop + videoBackground.offsetHeight
            const aboutUsTop = aboutUsSection.offsetTop
            const scrollY = window.scrollY

            // 동영상 영역이 끝나고 About us 영역이 보이기 시작하면 버튼을 동영상 영역 끝에 고정
            if (scrollY + window.innerHeight >= videoBottom || scrollY >= aboutUsTop - 100) {
                setIsSticky(true)
                buttonRef.current.classList.add('sticky')
            } else {
                setIsSticky(false)
                buttonRef.current.classList.remove('sticky')
            }
        }

        window.addEventListener('scroll', handleScroll)
        window.addEventListener('resize', handleScroll)
        handleScroll() // 초기 실행

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleScroll)
        }
    }, [])

    return (
        <div ref={videoBackgroundRef} className="video-background">
            <video
                ref={videoRef}
                className="video-background-video"
                muted
                loop
                playsInline
            >
                <source src="/Image/Main COMP.mp4" type="video/mp4" />
            </video>
            <div className="video-background-overlay"></div>
            <button 
                ref={buttonRef}
                className={`video-fitting-button ${isSticky ? 'sticky' : ''}`} 
                onClick={onNavigateToFitting}
            >
                피팅하러 가기
            </button>
        </div>
    )
}

export default VideoBackground

